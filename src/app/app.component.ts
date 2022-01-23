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
      startPosition: {latitude: 13.367797388285002, longitude:77.03707749682616},
    }
    this.LoadMap(data);
  }

  async play(){
    let routes = [
      {latitude: 13.367797388285002, longitude:77.03707749682616},
      {latitude:13.341074247677549, longitude:77.0394807561035},
      {latitude:13.379153826558369, longitude: 77.08685929614256},
      {latitude: 13.367797388285002, longitude:77.03707749682616}, 
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
      zoom: 12,
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
                url: "../assets/images/bus.png",
                scaledSize: new google.maps.Size(40, 40)
              }
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
                      strokeColor: 'green',
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

                      console.log(response)
                  } else {
                      console.log('Impossible d afficher la route ' + status)
                  }
              });
            }
        }))   

        // this.map.fitBounds(bounds);
    }
  }

  setMapOnAll(map: google.maps.Map | null) {
    for (let i = 0; i < this.markers.length; i++) {
      this.markers[i].setMap(map);
    }
  }
}
