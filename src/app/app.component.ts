///  <reference types="@types/googlemaps" />
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit  {
  map: google.maps.Map;
  markers: google.maps.Marker[] = [];

  async ngOnInit() {
    let data = {
      id: "route_map",
      startPosition: {latitude: '13.814163403421905', longitude: '100.55889009425664'},
    }
    this.LoadMap(data);
  }

  async play(){
    let routes = [
      {latitude: '13.814163403421905', longitude: '100.55889009425664'},
      {latitude: '13.81860434745408', longitude: '100.55838432855528'},
      {latitude: '13.821825103135906', longitude: '100.5582407713874'},
      {latitude: '13.839532774826273', longitude: '100.55736630045539'},
    ]

    await Promise.all(routes.map(async (route, index)=>{
      let data = {
        id: "route_map",
        startPosition: route,
        positions: routes,
        order: index
      }

      setTimeout(async () => {
        this.playBack(data);
      }, 1000*index )
    }));
  }

  LoadMap(mapSetting) {
    let mapProp = {
      center: {lat: +parseFloat(mapSetting.startPosition.latitude), lng: +parseFloat(mapSetting.startPosition.longitude)},
      zoom: 13,
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
    };

    this.map = new google.maps.Map(document.getElementById(mapSetting.id), mapProp);
  };

  async playBack(mapSetting): Promise<void>{
    this.map.setCenter({lat: +parseFloat(mapSetting.startPosition.latitude), lng: +parseFloat(mapSetting.startPosition.longitude)});
    
    if(mapSetting.positions){
        var listPois = [];
        var directions = [];
        
        mapSetting.positions.map((route, index)=>{
          listPois.push([(index+1).toString(), parseFloat(route.latitude), parseFloat(route.longitude)]);
        })

        await Promise.all(mapSetting.positions.map(async (value, i)=>{
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
        var directionsService = new google.maps.DirectionsService;

        this.setMapOnAll(null);
        this.markers = [];

        await Promise.all(listPois.map(async (value, i)=>{
          
          if(i == mapSetting.order){

            const marker = new google.maps.Marker({
              position: new google.maps.LatLng(value[1], value[2]),
              map: this.map,
              icon: {
                url: "../assets/images/car.png",
                scaledSize: new google.maps.Size(20, 40),
                anchor: new google.maps.Point(15, 30),
                rotation: i+1 == listPois.length?
                this.getBearingBetweenTwoPoints(new google.maps.LatLng(listPois[i-1][1], listPois[i-1][2]), new google.maps.LatLng(value[1], value[2])): 
                this.getBearingBetweenTwoPoints(new google.maps.LatLng(value[1], value[2]), new google.maps.LatLng(listPois[i+1][1], listPois[i+1][2])),
              },
            });

            this.markers.push(marker);
            this.setMapOnAll(this.map);
          }
        }));
      
        await Promise.all(directions.map(async (value, i)=>{
            if(i == mapSetting.order){
              var startPoint = new google.maps.LatLng(value['departLat'], value['departLng']);
              var endPoint = new google.maps.LatLng(value['arriveeLat'], value['arriveeLng']);
              var directionsDisplay = new google.maps.DirectionsRenderer({
                  map: this.map,
                  preserveViewport: true,
                  suppressMarkers: true,
                  polylineOptions: {
                      strokeColor: 'blue',
                      strokeOpacity: 0.5,
                      strokeWeight: 5
                  }
              });
      
              directionsService.route({
                  origin: startPoint,
                  destination: endPoint,
                  travelMode: google.maps.TravelMode.DRIVING,
              }, function(response, status) {
                  if (status === 'OK') {

                      directionsDisplay.setDirections(response);
                  } else {
                      console.log('Impossible d afficher la route ' + status)
                  }
              });
            }
        }))
    }
  }

  setMapOnAll(map: google.maps.Map | null) {
    for (let i = 0; i < this.markers.length; i++) {
      this.markers[i].setMap(map);
    }
  }

  getBearingBetweenTwoPoints(start, end) {

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

  degreesToRadians(degrees) {
    return degrees * Math.PI / 180.0;
  }

  radiansToDegrees(radians) {
    return radians * 180.0 / Math.PI;
  }
}
