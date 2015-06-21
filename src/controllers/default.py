#Default Controller
import json
import string
from src.services.extractionservice import ExtractionService
from src.services.statservice import StatService
from src.views.jinja import jinja_config
from json import JSONEncoder
from datetime import datetime, timedelta
import webapp2

# MainHandler: Homepage handler
class MainHandler(webapp2.RequestHandler):
  def get(self):
    x = ExtractionService('ga:991324')
    snapshot = x.run_query(x.build_page_query(["/default.aspx", "/current/default.aspx"]))
    #snapshot = x.run_query(x.build_search_query("/current/default.aspx"))
    template_values = {
      'snapshot': snapshot
    }
    template = jinja_config.JINJA_ENVIRONMENT.get_template('index.html')

    self.response.write(template.render(template_values))

class StatsHandler(webapp2.RequestHandler):
  def get(self):
    stat_service = StatService()
    all_stats = stat_service.get_all_stats()
    template = jinja_config.JINJA_ENVIRONMENT.get_template('stats.html')
    template_values = {
      'data': all_stats
    }
    self.response.write(template.render(template_values))

class SubmitHandler(webapp2.RequestHandler):
  def post(self):
    stat_service = StatService()
    stat = self.request.get('stat')
    stat_obj = json.loads(stat)
    stat_service.save_user_session(stat_obj, stat)
    self.response.write('True')
    self.response.headers["Access-Control-Allow-Origin"] = "*"

class DataHandler(webapp2.RequestHandler):
  def get(self):
    stat_service = StatService()
    all_stats = stat_service.get_all_stats()
    sdata = []
    for stat in all_stats:
      sdata.append(json.dumps(stat.to_dict(), cls=DateEncoder))

    json_stats = "[" + string.join(sdata,", ") + "]"
    self.response.write(json_stats)
    self.response.headers["Access-Control-Allow-Origin"] = "*"

# ErrorPage Handler: handle generic error
class ErrorPage(webapp2.RequestHandler):
  def get(self):
    template = jinja_config.JINJA_ENVIRONMENT.get_template('error.html')
    self.response.write(template.render())

def handle_404(request, response, exception):
  template = jinja_config.JINJA_ENVIRONMENT.get_template('error404.html')
  response.write(template.render())
  response.set_status(404)

def handle_500(request, response, exception):
  template = jinja_config.JINJA_ENVIRONMENT.get_template('error500.html')
  response.write(template.render())
  response.set_status(500)

#JSON Date Encoder: convert dates properly in JSON string
class DateEncoder(JSONEncoder):
  def default(self, obj):
    if isinstance(obj, datetime):
      return obj.isoformat()
    return JSONEncoder.default(self, obj)
# Error handlers
#app.error_handlers[404] = handle_404
#app.error_handlers[500] = handle_500