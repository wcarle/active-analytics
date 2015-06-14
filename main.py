#Active Analytics
from controllers.default import MainHandler
from controllers.default import SubmitHandler
from controllers.api import SnapshotHandler
from controllers.api import RankingHandler
from controllers.api import PopularHandler
import webapp2

app = webapp2.WSGIApplication([
  ('/', MainHandler),
  ('/submit', SubmitHandler),
  ('/snapshot*', SnapshotHandler),
  ('/ranking*', RankingHandler),
  ('/popular*', PopularHandler)
], debug=True)