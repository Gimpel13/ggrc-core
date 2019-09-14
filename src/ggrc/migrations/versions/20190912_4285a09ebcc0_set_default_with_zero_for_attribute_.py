# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
set default with zero for attribute_object_id

Create Date: 2019-09-12 10:36:35.985119
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op


# revision identifiers, used by Alembic.
revision = '4285a09ebcc0'
down_revision = '8937c6e26f00'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""

  op.execute("""
      SET SQL_SAFE_UPDATES=0;
      UPDATE `custom_attribute_values`
      SET `attribute_object_id` = 0
      WHERE `attribute_object_id` IS NULL;
      SET SQL_SAFE_UPDATES=1;
    """)

  op.execute("""
      ALTER TABLE `custom_attribute_values`
      MODIFY COLUMN `attribute_object_id` int(11) NOT NULL DEFAULT 0
  """)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
