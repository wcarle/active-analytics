import argparse
import sys
import logging
import uuid

from httplib2 import Http
from datetime import date, timedelta, datetime
from src.entities.useraction import *
from src.entities.userstat import *
from src.entities.useranswer import *
from src.entities.userclick import *


logger = logging.getLogger(__name__)

class StatService:
  def save_user_session(self, val, val_string):
    user_id = str(uuid.uuid4())
    actions = []
    answers = []
    clicks  = []
    for action in val['actions']:
      actions.append(UserAction(userid=user_id, url=action['url'], task=action['task'], taskid=action['taskId'], date=datetime.strptime(action['timestamp'], "%Y-%m-%dT%H:%M:%S.%fZ")))

    for answer in val['answers']:
      answers.append(UserAnswer(userid=user_id, question=answer['question'], questionid=answer['questionId'], answer=answer['answer']))

    for click in val['clicks']:
      clicks.append(UserClick(userid=user_id, url=click['url'], aaid=click['aaid'], href=click['href'], task=click['task'], taskid=click['taskId'], date=datetime.strptime(click['timestamp'], "%Y-%m-%dT%H:%M:%S.%fZ")))

    stat = UserStat(userid=user_id, frameworkEnabled=val['frameworkEnabled'], date=datetime.today(), userAgent=val['userAgent'], userActions=actions, userAnswers=answers, userClicks=clicks, raw=val_string)
    stat.put()

  def get_all_stats(self):
    db_stats = UserStat.query().order(-UserStat.date).fetch()
    return db_stats