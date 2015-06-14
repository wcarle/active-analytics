from google.appengine.ext import ndb
from src.entities.useraction import UserAction
from src.entities.useranswer import UserAnswer

class UserStat(ndb.Model):
  """Models an individual UserStat"""
  userid = ndb.StringProperty(indexed=True)
  userAgent = ndb.StringProperty(indexed=False)
  raw = ndb.StringProperty(indexed=False)
  userActions = ndb.StructuredProperty(UserAction, repeated=True)
  userAnswers = ndb.StructuredProperty(UserAnswer, repeated=True)
  date = ndb.DateTimeProperty()

