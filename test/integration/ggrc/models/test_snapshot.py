# Copyright (C) 2016 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for snapshot model."""

from ggrc.app import app
from ggrc.models import all_models
from integration.ggrc.converters import TestCase
from integration.ggrc.models import factories

TEST_MODELS = [
    all_models.Facility,
    all_models.AccessGroup,
    all_models.Clause,
    all_models.Contract,
    all_models.Control,
    all_models.DataAsset,
    all_models.Market,
    all_models.Objective,
    all_models.OrgGroup,
    all_models.Policy,
    all_models.Process,
    all_models.Product,
    all_models.Regulation,
    all_models.Risk,
    all_models.Section,
    all_models.Standard,
    all_models.System,
    all_models.Threat,
    all_models.Vendor,
]


class TestSnapshot(TestCase):
  """Basic tests for /query api."""

  IGNORE_KEYS = {
      # currently not working fields:
      "audit_duration",
      "audit_duration_id",

      "audit_frequency",
      "audit_frequency_id",

      "directive",
      "directive_id",

      "kind",
      "kind_id",

      "means",
      "means_id",

      "meta_kind",

      "network_zone",
      "network_zone_id",

      "verify_frequency",
      "verify_frequency_id",

      "assertions",
      "categories",
      "categorizations",
      "categorized_assertions",

      # special fields not needed for snapshots.
      "display_name",
      "preconditions_failed",
      "type",
      "workflow_state",

      "selfLink",
      "viewLink",


      # relationships and mappings
      "audit_objects",
      "audits",
      "controls",
      "object_owners",
      "object_people",
      "objects",
      "people",
      "related_destinations",
      "related_sources",
      "risk_objects",
      "risks",
      "task_group_objects",
      "task_group_tasks",
      "task_groups",

      "children",
      "parent",
      "parent_id",

      # we don't need context for snapshots since they are all under an audit.
      "context",
      "context_id",

      # obsolete fields that will be removed
      "custom_attributes",

      # following fields have been handled in fields without _id prefix. That
      # means that "contact" fields should exists and have correct values.
      "contact_id",
      "secondary_contact_id",

      "principal_assessor_id",
      "secondary_assessor_id",

      "modified_by_id",

      "attribute_object",
      "attribute_object_id",
      "attribute_value",
  }

  def setUp(self):
    """Set up test cases for all tests."""
    TestCase.clear_data()
    self._create_cas()
    self._import_file("all_snapshottable_objects.csv")

  @staticmethod
  def _create_cas():
    """Create custom attribute definitions."""
    for type_ in ["facility", "control", "market", "section"]:
      with app.app_context():
        factories.CustomAttributeDefinitionFactory(
            title="CA dropdown",
            definition_type=type_,
            attribute_type="Dropdown",
            multi_choice_options="one,two,three,four,five",
        )
        factories.CustomAttributeDefinitionFactory(
            title="CA text",
            definition_type=type_,
            attribute_type="Text",
        )
        factories.CustomAttributeDefinitionFactory(
            title="CA date",
            definition_type=type_,
            attribute_type="Date",
        )

  def test_revision_conent(self):
    """Test that revision contains all content needed."""

    facility_revision = all_models.Revision.query.filter(
        all_models.Revision.resource_type == "Facility").order_by(
        all_models.Revision.id.desc()).first()

    self.assertIn("custom_attribute_values", facility_revision.content)
    self.assertNotEqual(facility_revision.content[
                        "custom_attribute_values"], [])

  def _get_object(self, obj):
    return self.client.get(
        "/api/{}/{}".format(obj._inflector.table_plural, obj.id)
    ).json[obj._inflector.table_singular]

  def _clean_json(self, content):
    """Remove ignored items from JSON content.

    This function removes all ignored items from dicts, changes dates to
    isoformat changes values to int or unicode, so that the end result is a
    dict that can be compared with the JSON dict that was received from the
    server.

    Args:
      content: object that we want to clean, it can be a dict list or a value.

    Returns:
      content with all values cleaned up
    """
    if isinstance(content, list):
      return sorted(self._clean_json(value) for value in content)

    if hasattr(content, 'isoformat'):
      return unicode(content.isoformat())

    if isinstance(content, int):
      # We convert all numbers to the same type so that the diff of a failed
      # test looks nicer. This conversion does not affect the test results just
      # the output.
      return long(content)

    if not isinstance(content, dict):
      return content

    clean = {}
    for key, value in content.items():
      if key not in self.IGNORE_KEYS:
        clean[str(key)] = self._clean_json(value)

    return clean

  def test_snapshot_content(self):
    """Test the content of stored revisions

    The content in the revision (that is set by log_json) must match closely to
    what the api returns for a get request. This ensures that when a model is
    created from a snapshot on the fronend, it will have all the needed fields.
    """
    self.client.get("/login")
    for model in TEST_MODELS:
      obj = model.eager_query().first()
      generated_json = self._clean_json(obj.log_json())
      expected_json = self._clean_json(self._get_object(obj))
      self.assertEqual(expected_json, generated_json)
      self.assertEqual(expected_json, generated_json)
