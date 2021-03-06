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
from src.entities.userlog import *


logger = logging.getLogger(__name__)

class StatService:
  def save_user_session(self, val, user, val_string):
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

    stat = UserStat(userid=user_id, windowSize=val['windowSize'], frameworkEnabled=val['frameworkEnabled'], date=datetime.today(), userAgent=val['userAgent'], userActions=actions, userAnswers=answers, userClicks=clicks, raw=val_string)
    stat.put()

    usr = UserLog(first_name=user['first_name'], last_name=user['last_name'], nnumber=user['nnumber'], date=datetime.today())
    usr.put()

  def get_all_stats(self):
    db_stats = UserStat.query().order(-UserStat.date).fetch()
    return db_stats

  def check_user(self, nnumber):
    n = nnumber.lower();
    res = len(UserLog.query(UserLog.nnumber==n).fetch(1)) == 0
    return res