///  <reference types="@types/googlemaps" />
import { Component, NgZone, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit  {
  map: google.maps.Map;
  markers: google.maps.Marker[] = [];
  numberOfOrder: number = 1;
  totalKm: number = 0;

  constructor(private _zone:NgZone) {}

  async ngOnInit() {
    this.initMap();
  }

  initMap(){
    let data = {
      id: "route_map",
      startPosition: {latitude: '14.126312482537813', longitude: '100.62014245507306'},
      
    }
    this.LoadMap(data);
  }

  async play(){
    this.initMap();
    
    let routes = [
      {latitude: '14.126312482537813', longitude: '100.62014245507306'},
      {latitude: '14.12541770270331', longitude: '100.62017464157972'},
      {latitude: '14.125344871631786', longitude: '100.62096857541063'},
      {latitude: '14.125324062749923', longitude: '100.62184833992593'},
      {latitude: '14.125376084950998', longitude: '100.62325381738333'},
      {latitude: '14.125324062749923', longitude: '100.62385463217429'},
    ]

    let paybackArr = await Promise.all(routes.map(async (route, index)=>{
      return {
        id: "route_map",
        startPosition: route,
        positions: routes,
        order: index
      }
    }));


    await this.playBack(paybackArr);
  }

  LoadMap(mapSetting: { id: any; startPosition: any; }) {
    this.map = null;
    this.totalKm = 0;

    let mapProp = {
      center: {lat: +parseFloat(mapSetting.startPosition.latitude), lng: +parseFloat(mapSetting.startPosition.longitude)},
      zoom: 17,
      fillColor: '#AA0000',
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      clickableIcons: true,
      mapTypeControl: false,
      draggable: true,
      scaleControl: true,
      scrollwheel: true,
      navigationControl: true,
      streetViewControl: false,
      zoomControl: true,
      fullscreenControl: false
    };

    this.map = new google.maps.Map(document.getElementById(mapSetting.id), mapProp);
  };

  async playBack(paybackArr: Array<any>): Promise<void>{

    await Promise.all(paybackArr.map(async (mapSetting, setIndex)=>{
      var directionsService = new google.maps.DirectionsService;
      var directionsDisplay = new google.maps.DirectionsRenderer({
        map: this.map,
        preserveViewport: true,
        suppressMarkers: true,
        polylineOptions: {
            strokeColor: 'red',
            strokeOpacity: 1,  
            strokeWeight: 4,
        }
      });
      
      setTimeout(async () => {

        this.map.setCenter({lat: +parseFloat(mapSetting.startPosition.latitude), lng: +parseFloat(mapSetting.startPosition.longitude)});
    
        if(mapSetting.positions){
    
            var listPois = [];
            var directions = [];
            
            mapSetting.positions.map((route: { latitude: string; longitude: string; }, index: number)=>{
              listPois.push([(index+1).toString(), parseFloat(route.latitude), parseFloat(route.longitude)]);
            })
    
            await Promise.all(mapSetting.positions.map(async (value: { latitude: string; longitude: string; }, i: number)=>{
                if(i+1 != mapSetting.positions.length)
                    directions.push(
                        {
                          departLat: parseFloat(value.latitude),
                          departLng: parseFloat(value.longitude),
                          arriveeLat: parseFloat(mapSetting.positions[i+1]?.latitude),
                          arriveeLng: parseFloat(mapSetting.positions[i+1]?.longitude),
                        }
                    );
            }));
        
            this.setMapOnAll(null);
            this.markers = [];
   
            await Promise.all(listPois.map(async (value, i)=>{
        
              if(i == mapSetting.order){
    
                const marker = new google.maps.Marker({
                  position: new google.maps.LatLng(value[1], value[2]),
                  map: this.map,
                  icon: {
                    path: "M17.402,0H5.643C2.526,0,0,3.467,0,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759c3.116,0,5.644-2.527,5.644-5.644 V6.584C23.044,3.467,20.518,0,17.402,0z M22.057,14.188v11.665l-2.729,0.351v-4.806L22.057,14.188z M20.625,10.773 c-1.016,3.9-2.219,8.51-2.219,8.51H4.638l-2.222-8.51C2.417,10.773,11.3,7.755,20.625,10.773z M3.748,21.713v4.492l-2.73-0.349 V14.502L3.748,21.713z M1.018,37.938V27.579l2.73,0.343v8.196L1.018,37.938z M2.575,40.882l2.218-3.336h13.771l2.219,3.336H2.575z M19.328,35.805v-7.872l2.729-0.355v10.048L19.328,35.805z",
                    scale: .7,
                    strokeColor: 'white',
                    strokeWeight: .10,
                    fillOpacity: 1,
                    fillColor: '#404040',
                    anchor: new google.maps.Point(10, 30),
                    rotation: i+1 == listPois.length?this.getBearingBetweenTwoPoints(new google.maps.LatLng(listPois[i-1][1], listPois[i-1][2]), new google.maps.LatLng(value[1], value[2])): this.getBearingBetweenTwoPoints(new google.maps.LatLng(value[1], value[2]), new google.maps.LatLng(listPois[i+1][1], listPois[i+1][2])),
                  },
                });
    
                this.markers.push(marker);
                this.setMapOnAll(this.map);
   
                setTimeout(() => {
                  if(directions[i] == undefined){
                    return;
                  }

                  var startPoint = new google.maps.LatLng(directions[i]['departLat'], directions[i]['departLng']);
                  var endPoint = new google.maps.LatLng(directions[i]['arriveeLat'], directions[i]['arriveeLng']);
    
                  directionsService.route({
                    origin: startPoint,
                    destination: endPoint,
                    travelMode: google.maps.TravelMode.DRIVING,
                  }, (response, status) => this._zone.run(() => {

                    if (status === google.maps.DirectionsStatus.OK) {
                      this.numberOfOrder = setIndex+ 1;
                      this.totalKm = this.totalKm + (response?.routes[0]?.legs[0]?.distance?.value / 1000);

                      directionsDisplay.setDirections(response);

                      console.log(response)
                    }else {
                      console.log('Impossible d afficher la route ' + status)
                    }
                  }));
                }, 1000);
              }
            }));
        }

      }, setIndex * 1000);
    }));
  }

  setMapOnAll(map: google.maps.Map | null) {
    for (let i = 0; i < this.markers.length; i++) {
      this.markers[i].setMap(map);
    }
  }

  getBearingBetweenTwoPoints(start: google.maps.LatLng, end: google.maps.LatLng) {

    var latStart = this.degreesToRadians(start.lat());
    var lngStart = this.degreesToRadians(start.lng());
    var latEnd = this.degreesToRadians(end.lat());
    var longEnd = this.degreesToRadians(end.lng());

    var dLon = (longEnd - lngStart);


    var y = Math.sin(dLon) * Math.cos(latEnd);
    var x = Math.cos(latStart) * Math.sin(latEnd) - Math.sin(latStart)
            * Math.cos(latEnd) * Math.cos(dLon);

    var radiansBearing = Math.atan2(y, x);

    return this.radiansToDegrees(radiansBearing);
  }

  degreesToRadians(degrees: number) {
    return degrees * Math.PI / 180.0;
  }

  radiansToDegrees(radians: number) {
    return radians * 180.0 / Math.PI;
  }
}
