import argparse
import sys
import logging
import uuid

from httplib2 import Http
from datetime import date, timedelta, datetime
from src.entities.useraction import *
from src.entities.userstat import *
from src.entities.useranswer import *


logger = logging.getLogger(__name__)

class StatService:
  def save_user_session(self, val, val_string):
    user_id = str(uuid.uuid4())
    actions = []
    answers = []
    for action in val['actions']:
      actions.append(UserAction(userid=user_id, url=action['url'], task=action['task'], taskid=action['taskId'], date=datetime.strptime(action['timestamp'], "%Y-%m-%dT%H:%M:%S.%fZ")))

    for answer in val['answers']:
      answers.append(UserAnswer(userid=user_id, question=action['question'], questionid=answer['questionId'], answer=answer['answer']))

    stat = UserStat(userid=user_id, date=datetime.today(), userAgent=val['userAgent'], userActions=actions, userAnswers=answers, raw=val_string)
    stat.put()