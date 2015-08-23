from google.appengine.ext import ndb
from src.entities.useraction import UserAction
from src.entities.useranswer import UserAnswer
from src.entities.userclick import UserClick

class UserStat(ndb.Model):
  """Models an individual UserStat"""
  userid = ndb.StringProperty(indexed=True)
  userAgent = ndb.StringProperty(indexed=False)
  windowSize = ndb.StringProperty(indexed=False)
  raw = ndb.StringProperty(indexed=False)
  userActions = ndb.StructuredProperty(UserAction, repeated=True)
  userAnswers = ndb.StructuredProperty(UserAnswer, repeated=True)
  userClicks  = ndb.StructuredProperty(UserClick, repeated=True)
  frameworkEnabled = ndb.BooleanProperty()
  date = ndb.DateTimeProperty()

