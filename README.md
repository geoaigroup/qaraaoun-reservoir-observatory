# Qaraaoun Reservoir Observatory  

![image](https://github.com/geoaigroup/qaraaoun-reservoir-observatory/assets/14883982/ac5d3ad7-882b-48bd-a959-d79ab19c0709)

Qaraaoun Reservoir Volume Estimation from Aerial Images is an essential building block to enable scientists and researchers understand the hydrological dynamics of the largest water reservoir in Lebanon. In this project, we combined advanced image processing and machine learning techniques, LandSat 1-9 and Sentinel-2 imageries to provide the first 50+ Years time-series of water volume of the Qaraaoun reservoir.  

[Dashboard](http://geoai.cnrs.edu.lb/qaraaoun) is being autonomously updated on a daily basis. 

## Imagery Sources

| Sensor | Years | Service | Collection | Bands (R/G/B) | Notes |
|---|---|---|---|---|---|
| Sentinel-2 | 2015– | CDSE WMS | — | TRUE-COLOR-S2L1C | Synchronous, L1C (TOA) |
| LandSat-8/9 | 2013– | CDSE WMS | — | TRUE-COLOR-L89 | Synchronous |
| LandSat-7 | 1999– | PC Titiler | landsat-c2-l2 | red/green/blue | Async, SR |
| LandSat-5 | 1984–2013 | PC Titiler | landsat-c2-l2 | red/green/blue | Async, SR |
| LandSat-4 | 1982–1993 | PC Titiler | landsat-c2-l2 | red/green/blue | Async, SR |
| LandSat-3 | 1978–1983 | PC Titiler | landsat-c2-l1 | nir08/red/green | Async, CIR, 8-bit DN |
| LandSat-2 | 1975–1982 | PC Titiler | landsat-c2-l1 | nir08/red/green | Async, CIR, 8-bit DN |
| LandSat-1 | 1972–1978 | PC Titiler | landsat-c2-l1 | nir08/red/green | Async, CIR, 8-bit DN |

**SR** = surface reflectance (Level-2, free via [Microsoft Planetary Computer](https://planetarycomputer.microsoft.com)).  
**CIR** = color infrared false color (no blue band in MSS sensor).  
**CDSE** = [Copernicus Dataspace](https://dataspace.copernicus.eu) (free WMS).  
**Async** = shows ESRI World Imagery while STAC search runs, then swaps to date-specific tiles.

## Funding and References
- This work was partially supported by [SEALACOM](http://www.cnrs.edu.lb/english/call-of-interest/calls-for-proposals-by-cnrs/sealacom-call-for-researchers).  

- We relied on both water-observatory [front-end](https://github.com/sentinel-hub/water-observatory-frontend) and [back-end](https://github.com/sentinel-hub/water-observatory-backend) while developping this project.  

## Contact
Feel free to reach out via contact widget [Contact](https://geogroup.ai/#contact) or through email aghandour at cnrs.edu.lb.

## Disclaimer
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
