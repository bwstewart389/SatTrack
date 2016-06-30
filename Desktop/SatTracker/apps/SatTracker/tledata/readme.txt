This JSON data is retrieved from www.space-track.org API. It's used mainly to get the Two Line Element (TLE) sets
for characterization of the orbits and to gather additional information about the satellites.
The JSON data is retrieved in the backend to this folder each week.

www.space-track.org API documentation can be found in:
https://www.space-track.org/documentation#/api
https://www.space-track.org/documentation#/howto

The query that is being made is:

https://www.space-track.org/basicspacedata/query/class/tle_latest/ORDINAL/1/EPOCH/>now-30/OBJECT_TYPE/PAYLOAD/orderby/NORAD_CAT_ID asc/metadata/false

This results in a JSON file which is less than 4MB in size. Wider queries result in way higher sizes (+20 MB) and have stuff that
we don't really need (space debris, rocket bodies, prior orbits and such).

Legend:

class: tle_latest
Latest TLE data as opposed to historical data.

ORDINAL: 1
Retrieve only the very latest TLE data. Further ordinals (2nd, 3rd...) imply prior TLE data for a given object.

EPOCH: >now-30
Satellites in orbit for the last 30 days.

OBJECT_TYPE: PAYLOAD
Only retrieve data from payloads i.e. satellites. No need to get data from e.g. debris or rocket bodies.

orderby: NORAD_CAT_ID asc
Ascendant order by NORAD ID number. Not really important.

metadata: false
No need to gather metadata.

