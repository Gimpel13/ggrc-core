# Copyright (C) 2014 Google Inc., authors, and contributors <see AUTHORS file>
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
# Created By: mouli@meics.org
# Maintained By: dan@reciprocitylabs.com


"""
 GGRC calendar service base class
"""


from flask import current_app
from apiclient import errors
from apiclient.discovery import build
import httplib2
from ggrc.notification import NotificationBase, isNotificationEnabled
from ggrc.models import Person, Notification, NotificationObject, NotificationRecipient
from datetime import datetime
from ggrc import db

class CalendarNotification(NotificationBase):
  start_date=None
  end_date=None
  calendar_service=None
  def __init__(self, notif_type='Calendar'):
    super(CalendarNotification, self).__init__(notif_type)

  def prepare(self, target_objs, sender, recipients, subject, content):
    now=datetime.now()
    notification=Notification(
      notif_pri=self.notif_pri,
      notif_date=now,
      created_at=now,
      content=content,
      subject=subject,
      sender_id=sender.id
     )
    db.session.add(notification)
    db.session.flush()

    for obj in target_objs:
      if hasattr(obj, 'status'):
        status=obj.status
      else:
        status='InProgress'
      notification_object=NotificationObject(
        created_at=datetime.now(),
        object_id=obj.id,
        object_type=obj.type,
        modified_by_id=sender.id,
        status=status,
        notification=notification
      )
      db.session.add(notification_object)
      db.session.flush()

    for recipient in recipients:
      notification_recipient=NotificationRecipient(
        created_at=datetime.now(),
        status='InProgress',
        notif_type=self.notif_type,
        recipient_id=recipient.id,
        notification=notification
      )
      db.session.add(notification_recipient)
      db.session.flush()

    return notification

  def notify(self):
    pending_notifications=db.session.query(Notification).\
      join(Notification.recipients).\
      filter(NotificationRecipient.status == 'InProgress').\
      filter(NotificationRecipient.notif_type == self.notif_type)

    enable_notif={}
    for notification in pending_notifications:
      self.notify_one(notification)

  def notify_one(self, notification, override=False):
    sender=Person.query.filter(Person.id==notification.sender_id).first()
    assignees={}
    enable_notif={}
    for notify_recipient in notification.recipients:
      if notify_recipient.notif_type != self.notif_type:
        continue
      recipient_id=notify_recipient.recipient_id
      if recipient_id is None:
        continue
      if not enable_notif.has_key(recipient_id):
        if override:
          enable_notif[recipient_id]=True
        else:
          enable_notif[recipient_id]=isNotificationEnabled(recipient_id, self.notif_type)
      if not enable_notif[recipient_id]:
        continue
      recipient=Person.query.filter(Person.id==recipient_id).first()
      if recipient is None:
        continue
      if not assignees.has_key(recipient.id):
        assignees[recipient.id]={'email': recipient.email}

    event_details= {
      'summary': notification.subject,
      'start': {
        'date': str(self.start_date)
      },
      'end': {
        'date': str(self.end_date)
      },
      'description':  notification.content,
    }
    calendar_event=create_calendar_event(self.calendar_service, sender.email, event_details)
    if calendar_event is None:
      current_app.logger.error("Error occured in creating calendar event, id: " +\
        sender.email + " event: " + event_details['summary'])
    # ToDo(Mouli): Prepare Acls to allow assignees with writer role
    # ToDo(Mouli): Handling of Reminders 
    if len(assignees) > 0:
      for id, assignee in assignees.items():
        if not calendar_event.has_key('attendees'):
          calendar_event['attendees']=[]
        calendar_event['attendees'].append(assignee)
      updated_event=update_calendar_event(self.calendar_service, sender.email, calendar_event['id'], calendar_event)
      if updated_event is None:
       current_app.logger.error("Error occured in updating calendar: " + \
         sender.email + " for event: " + calendar_event['summary'])
    else:
       current_app.logger.info("There are no recipients to update calendar: " + \
         sender.email + " for event: " + calendar_event['summary'])

    # ToDo(Mouli): Handle error scenarios gracefully by setting notification recipient status to Error with error text
    for notify_recipient in notification.recipients:
      if notify_recipient.notif_type != self.notif_type:
        continue
      if enable_notif.has_key(notify_recipient.recipient_id) and \
         enable_notif[notify_recipient.recipient_id]:
        notify_recipient.status="Successful"
      else:
        notify_recipient.status="NotificationDisabled"
      db.session.add(notify_recipient)
      db.session.flush()

class CalendarService(object):
  calendar_service=None
  credentials=None

  def __init__(self, credentials=None):
    if credentials is not None:
      self.credentials=credentials
      http = httplib2.Http()
      http = self.credentials.authorize(http)
      self.calendar_service=build(serviceName='calendar', version='v3', http=http)

def create_calendar_event(calendar_service, calendar_id, event_details):
  calendar_event=None
  try:
    calendar_event=calendar_service.events().insert(
      calendarId=calendar_id,
      body=event_details).execute()
  except errors.HttpError, error:
    current_app.logger.error("HTTP Error occured in creating calendar event: " + str(error))
  except Exception, error:
    current_app.logger.error("Exception occured in creating calendar event: " + str(error))
  return calendar_event 

def get_calendar_event(calendar_service, calendar_id, event_id):
  page_token = None
  while True:
    try:
      events=calendar_service.events().list(calendarId=calendar_id, q=event_id, pageToken=page_token).execute()
    except errors.HttpError, error:
      current_app.logger.info("HTTP Error occured in getting calendar events: " + str(error))
      break
    except Exception, error:
      current_app.logger.info("Exception occured in getting calendar events: " + str(error))
      break
    for event in events['items']:
      if event.has_key('summary'):
        if event['summary'] in [event_id]:
          return event 
    page_token = events.get('nextPageToken')
    if not page_token:
      break
  return None
  
def update_calendar_event(calendar_service, calendar_id, event_id, event_details):
  calendar_event=None
  try:
    calendar_event=calendar_service.events().update(
      calendarId=calendar_id,
      eventId=event_id,
      body=event_details).execute()
    current_app.logger.info("Update Calendar event id: " + calendar_event['id'] +\
      " summary: " + calendar_event['summary'])
  except errors.HttpError, error:
    current_app.logger.info("HTTP Error occured in updating calendar event: " + str(error))
  except Exception, error:
    current_app.logger.info("Exception occured in updating calendar event: " + str(error))
  return calendar_event 

# ToDo(Mouli) Add Acl writer roles all members of the workflow
def create_calendar_acls(calendar_service, calendar_id, acls):
  pass

# ToDo(Mouli) Get Acl roles for specified calendar
def get_calendar_acls(calendar_service, calendar_id):
  pass

