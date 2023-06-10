# Import flask and datetime module for showing date and time
from flask import Flask, request
import datetime
import ee
import folium
from IPython.display import display
from datetime import datetime, timedelta
from flask_cors import CORS
import re
# Initializing flask app
app = Flask(__name__)
CORS(app)
sentinel = "Sentinel-2"
landsat4 = "LandSat-4"
landsat5 = "LandSat-5"
landsat8 = "LandSat-8"
# Route for seeing a data
'''
def maskS2clouds(image):
    qa = image.select('QA60')

    # Bits 10 and 11 are clouds and cirrus, respectively.
    cloudBitMask = 1 << 10
    cirrusBitMask = 1 << 11

    # Both flags should be set to zero, indicating clear conditions.
    mask = qa.bitwiseAnd(cloudBitMask).eq(0).And(qa.bitwiseAnd(cirrusBitMask).eq(0))

    return image.updateMask(mask) \
      .select("B.*") \
      .copyProperties(image, ["system:time_start"])
'''

#for Landsat-4/5 images
def applyScaleFactors(image):
  opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2)
  thermalBand = image.select('ST_B6').multiply(0.00341802).add(149.0)
  return image.addBands(opticalBands, None, True).addBands(thermalBand, None, True)

def applyScaleFactors8(image):
  opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2)
  thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0)
  return image.addBands(opticalBands, None, True)\
              .addBands(thermalBands, None, True)
  
def setCollection(tiler, sensor):
  collection = None 
  if(sensor == landsat5):
    collection = 'LANDSAT/LT05/C02/T'+tiler+'_L2'
  elif(sensor == sentinel):
    collection = 'COPERNICUS/S2_HARMONIZED'
  elif(sensor == landsat4):
    collection = 'LANDSAT/LT04/C02/T'+tiler+'_L2'
  elif(sensor == landsat8):
    collection = 'LANDSAT/LC08/C02/T'+tiler+'_L2'
  
  return collection, sensor

def get_day_ahead(date_str):
    date_format = "%Y-%m-%d"
    given_date = datetime.strptime(date_str, date_format)
    day_ahead = given_date + timedelta(days=1)
    return day_ahead.strftime(date_format)

def retrieveImage(setcollection, measurement_date):
  coords = [
        35.697950593910825,
        33.574245370273864, 
        ]
  collection, sensor = setcollection
  print("retrieveImage: "+collection)
  region = ee.Geometry.Point(coords)
  dataset = ee.ImageCollection(collection).filterDate(measurement_date, get_day_ahead(measurement_date)).filter(ee.Filter.bounds(region))
  if (sensor == sentinel):
      dataset = dataset.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)) \
    .filter(ee.Filter.bounds(region))
  elif (sensor == landsat5 or sensor == landsat4):
      dataset = dataset.map(applyScaleFactors)
  elif (sensor == landsat8):
      dataset = dataset.map(applyScaleFactors8)
  return dataset.first()


    # Define a method for displaying Earth Engine image tiles on a folium map.
def add_ee_layer(self, vis_params, name, sensor, measurement_date):
    ee_object = retrieveImage(setCollection('1', sensor), measurement_date)
    map_id_dict = None
    try:
        map_id_dict = ee.Image(ee_object).getMapId(vis_params)
    except:
        ee_object = retrieveImage(setCollection('2', sensor), measurement_date)
        map_id_dict = ee.Image(ee_object).getMapId(vis_params)
    folium.raster_layers.TileLayer(
    tiles = map_id_dict['tile_fetcher'].url_format,
    attr = 'Google Earth Engine',
    name = name,
    overlay = True,
    control = True
    ).add_to(self)
                
        # Add EE drawing method to folium.


@app.route('/data', methods=['GET'])
def re():
    service_account = 'qarounrs@qaraoun20602.iam.gserviceaccount.com'
    credentials = ee.ServiceAccountCredentials(service_account, 'privateKey.json')
    ee.Initialize(credentials)
    try:
        measurement_date = request.args.get('measurementDate')
        print(measurement_date)
        print(get_day_ahead(measurement_date))
        sensor = request.args.get('sensor_type')
        outline = request.args.get('measurementOutline')
        visualization = {}
        if(sensor == sentinel):
             visualization = {
                'min': 0.0,
                'max': 3000,
                'bands': ['B4', 'B3', 'B2']
            }
        elif (sensor == landsat5):
             visualization = {
            'bands': ['SR_B3', 'SR_B2', 'SR_B1'],
            'min': 0.0,
            'max': 0.3
            }
        elif (sensor == landsat4):
            visualization = {
            'bands': ['SR_B3', 'SR_B2', 'SR_B1'],
            'min': 0.0,
            'max': 0.3,
            }
        elif (sensor == landsat8):
            visualization = {
            'bands': ['SR_B4', 'SR_B3', 'SR_B2'],
            'min': 0.0,
            'max': 0.3,
            }
        folium.Map.add_ee_layer = add_ee_layer
        Map = folium.Map(location=(33.574245370273864, 35.697950593910825), zoom_start=12)
        Map.add_ee_layer(visualization, "name", sensor, measurement_date)
        geojson_file = "path/to/your/geojson/file.geojson"

# Create a GeoJSON layer and add it to the map
        try:
            folium.Choropleth(geo_data="maps/"+measurement_date+".json", line_color="yellow", line_weight=1, fill_color="transparent").add_to(Map)   
        except:
            print("error")
        display(Map)
        height_css = ".folium-map { height: 400px !important; }"
        html = Map._repr_html_()
        print(type(html))
        # Regular expression pattern to match the height value
        return html
        
        # Rest of your code
        # Return a valid response

    except Exception as e:
        print('An error occurred:', str(e))



	
# Running app
if __name__ == '__main__':
	app.run(debug=True)