import json
from collections import OrderedDict

# Opening JSON file
f_src = open('38784.json')
f_dest = open('All.json')  

# returns JSON object as 
# a dictionary
data_src = json.load(f_src)
data_dest = json.load(f_dest)

# Iterating through the json
# list
for i in data_src['measurements']:
    if 'volume' in i and i['volume'] > 0:
        index = next((j for j, item in enumerate(data_dest['measurements']) if item['date'] == i['date']), None)
        if data_dest['measurements'][index]['sensor_type'] == "Sentinel-2":
            data_dest['measurements'][index]['volume'] = i['volume']

for i in data_dest['measurements']:
    i.pop('cc')
    i.pop('max_level')
    i.pop('min_level')

# with open("All.json", "w") as outfile:
#     json.dump(data_dest, outfile)
json.dump(data_dest, open('All.json', 'w'), sort_keys=True, indent=4, separators=(',', ': '))

# Closing file
f_src.close()
f_dest.close()