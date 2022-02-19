///  <reference types="@types/googlemaps" />
import { Component, NgZone, OnInit } from '@angular/core';
import { MatSliderChange } from '@angular/material/slider';
import { timer } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit  {
  isLoading: boolean = false;

  action: string = "stop";
  map: google.maps.Map;
  markers: google.maps.Marker[] = [];
  numberOfOrder: number = 0;
  numberOfStore: number = 0;
  totalKm: number = 0;

  timeLeft: number = 0;
  interval = null;
  subscribeTimer: any;
  time:  number = 1000;

  routes = [];

  formatLabel(value: number) {
    return value;
  }

  constructor(private _zone:NgZone) {}

  async ngOnInit() {
        
    this.routes = [
      {latitude: '42.42679066670903', longitude: '-83.29210638999939'},
      {latitude: '42.42300508749226', longitude: '-83.29679489135742'},
      {latitude: '42.42304468678425', longitude: '-83.29434871673584'},
      {latitude: '42.424882066428424', longitude: '-83.2944130897522'},
      {latitude: '42.42495334300206', longitude: '-83.29203128814697'},
    ]

    this.initMap();
  }

  initMap(){
    let data = {
      id: "route_map",
      startPosition: {latitude: '42.42679066670903', longitude: '-83.29210638999939'},
      
    }
    this.LoadMap(data);
  }

  async play(action: string){
    this.action = action;

    if(action == 'stop'){
      this.pauseTimer();

      return;
    }
    if(this.numberOfStore > 0){
      
      let paybackArr = await Promise.all(this.routes.map(async (route, index)=>{
        return {
          id: "route_map",
          startPosition: route,
          positions: this.routes,
          order: index
        }
      }));

      paybackArr = paybackArr.filter((pay, index)=> index >= this.numberOfStore);
  
      this.playBack(paybackArr);

    }else{
      this.numberOfStore = 0; 

      if(this.timeLeft == 0){
        this.initMap();
      }
  
      let paybackArr = await Promise.all(this.routes.map(async (route, index)=>{
        return {
          id: "route_map",
          startPosition: route,
          positions: this.routes,
          order: index
        }
      }));
  
      this.playBack(paybackArr);
    }
  }

  LoadMap(mapSetting: { id: any; startPosition: any; }) {
    this.map = null;
    this.totalKm = 0;

    let mapProp = {
      center: {lat: +parseFloat(mapSetting.startPosition.latitude), lng: +parseFloat(mapSetting.startPosition.longitude)},
      zoom: 15,
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
    if(this.timeLeft == 0){
      this.timeLeft = paybackArr.length;
    }
    this.interval = setInterval(async () => {

      if (this.timeLeft == 0) {
        this.pauseTimer();

        this.numberOfStore = 0;
      } else if (this.timeLeft > 0) {

        this.setPoint(paybackArr, paybackArr.length - this.timeLeft);
        this.timeLeft--;
      }
    }, this.time);
  }

  async setPoint(paybackArr, index: number){
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

    this.map.setCenter({lat: +parseFloat(paybackArr[index].startPosition.latitude), lng: +parseFloat(paybackArr[index].startPosition.longitude)});

    if(paybackArr[index].positions){

      var directions = [];

      await Promise.all(paybackArr[index].positions.map(async (value: { latitude: string; longitude: string; }, i: number)=>{
        if(i+1 != paybackArr[index].positions.length)
            directions.push(
                {
                  departLat: parseFloat(value.latitude),
                  departLng: parseFloat(value.longitude),
                  arriveeLat: parseFloat(paybackArr[index].positions[i+1]?.latitude),
                  arriveeLng: parseFloat(paybackArr[index].positions[i+1]?.longitude),
                }
            );
      }));

      await Promise.all(paybackArr[index].positions.map(async (value, i)=>{
        
        if(i == paybackArr[index].order){

          if(directions[i] == undefined){
            return;
          }

          var startPoint = new google.maps.LatLng(directions[i]['departLat'], directions[i]['departLng']);
          var endPoint = new google.maps.LatLng(directions[i]['arriveeLat'], directions[i]['arriveeLng']);

          directionsService.route({
            origin: startPoint,
            destination: endPoint,
            travelMode: google.maps.TravelMode.DRIVING,
          }, (response, status) => this._zone.run(async () => {

            if (status === google.maps.DirectionsStatus.OK) {
              if(this.numberOfStore > 0){
                this.numberOfOrder = this.numberOfOrder+1;
              }else{
                this.numberOfOrder = index+1;
              }
              this.totalKm = this.totalKm + (response?.routes[0]?.legs[0]?.distance?.value / 1000);

              directionsDisplay.setDirections(response);

              let average = this.time/ response.routes[0].overview_path.length;

              await Promise.all(response.routes[0].overview_path.map(async (item, index)=>{
                setTimeout(async () => {
                  this.setMapOnAll(null);
                  this.markers = [];

                  const marker = new google.maps.Marker({
                    position: new google.maps.LatLng(item.lat(), item.lng()),
                    map: this.map,
                    icon: {
                      path: "M17.402,0H5.643C2.526,0,0,3.467,0,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759c3.116,0,5.644-2.527,5.644-5.644 V6.584C23.044,3.467,20.518,0,17.402,0z M22.057,14.188v11.665l-2.729,0.351v-4.806L22.057,14.188z M20.625,10.773 c-1.016,3.9-2.219,8.51-2.219,8.51H4.638l-2.222-8.51C2.417,10.773,11.3,7.755,20.625,10.773z M3.748,21.713v4.492l-2.73-0.349 V14.502L3.748,21.713z M1.018,37.938V27.579l2.73,0.343v8.196L1.018,37.938z M2.575,40.882l2.218-3.336h13.771l2.219,3.336H2.575z M19.328,35.805v-7.872l2.729-0.355v10.048L19.328,35.805z",
                      scale: .7,
                      strokeColor: 'white',
                      strokeWeight: .10,
                      fillOpacity: 1,
                      fillColor: '#404040',
                      anchor: new google.maps.Point(10, 30),
                      rotation: index+1 == response.routes[0].overview_path.length?this.getBearingBetweenTwoPoints(new google.maps.LatLng(response.routes[0].overview_path[index-1].lat(), response.routes[0].overview_path[index-1].lng()), new google.maps.LatLng(item.lat(), item.lng())): this.getBearingBetweenTwoPoints(new google.maps.LatLng(item.lat(), item.lng()), new google.maps.LatLng(response.routes[0].overview_path[index+1].lat(), response.routes[0].overview_path[index+1].lng()))
                    },
                  });

                  this.markers.push(marker);
                  await this.setMapOnAll(this.map);

                }, index * average);
              }));
            }else {
              console.log('Impossible d afficher la route ' + status)
            }
          }));
        }
      }));
    }

  }

  pauseTimer() {
    this.action = 'stop';
    clearInterval(this.interval);
  }

  async setMapOnAll(map: google.maps.Map | null) {
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


  async onInputChange(event: MatSliderChange) {
    this.action = 'stop';

    if(event.value > 0){
      setTimeout(async () => {
        this.initMap();
      
        let paybackArr = await Promise.all(this.routes.map(async (route, index)=>{
          return {
            id: "route_map",
            startPosition: route,
            positions: this.routes,
            order: index
          }
        }));
        this.setDirection(paybackArr, event.value);
      }, 1000);
    }else{
      this.numberOfStore = 0;

      this.initMap();
    }
  }

  async setDirection(paybackArr: Array<any>, selectValue: number){

    paybackArr = paybackArr.filter((pay, index)=> index < selectValue);
    
    await Promise.all(paybackArr.map(async (item, index)=>{
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

      if(paybackArr[index].positions){

        var directions = [];
  
        await Promise.all(paybackArr[index].positions.map(async (value: { latitude: string; longitude: string; }, i: number)=>{
          if(i+1 != paybackArr[index].positions.length)
              directions.push(
                  {
                    departLat: parseFloat(value.latitude),
                    departLng: parseFloat(value.longitude),
                    arriveeLat: parseFloat(paybackArr[index].positions[i+1]?.latitude),
                    arriveeLng: parseFloat(paybackArr[index].positions[i+1]?.longitude),
                  }
              );
        }));
    
        await Promise.all(paybackArr[index].positions.map(async (value, i)=>{

          if(i == paybackArr[index].order){

            if(directions[i] == undefined){
              return;
            }
  
            var startPoint = new google.maps.LatLng(directions[i]['departLat'], directions[i]['departLng']);
            var endPoint = new google.maps.LatLng(directions[i]['arriveeLat'], directions[i]['arriveeLng']);
  
            directionsService.route({
              origin: startPoint,
              destination: endPoint,
              travelMode: google.maps.TravelMode.DRIVING,
            }, async (response, status) => await this._zone.run(async () => {

              if (status === google.maps.DirectionsStatus.OK) {
                if(i+ 1 === paybackArr.length){
                  this.setMapOnAll(null);
                  this.markers = [];
  
                  const marker = new google.maps.Marker({
                    position: new google.maps.LatLng(directions[i]['arriveeLat'], directions[i]['arriveeLng']),
                    map: this.map,
                    icon: {
                      path: "M17.402,0H5.643C2.526,0,0,3.467,0,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759c3.116,0,5.644-2.527,5.644-5.644 V6.584C23.044,3.467,20.518,0,17.402,0z M22.057,14.188v11.665l-2.729,0.351v-4.806L22.057,14.188z M20.625,10.773 c-1.016,3.9-2.219,8.51-2.219,8.51H4.638l-2.222-8.51C2.417,10.773,11.3,7.755,20.625,10.773z M3.748,21.713v4.492l-2.73-0.349 V14.502L3.748,21.713z M1.018,37.938V27.579l2.73,0.343v8.196L1.018,37.938z M2.575,40.882l2.218-3.336h13.771l2.219,3.336H2.575z M19.328,35.805v-7.872l2.729-0.355v10.048L19.328,35.805z",
                      scale: .7,
                      strokeColor: 'white',
                      strokeWeight: .10,
                      fillOpacity: 1,
                      fillColor: '#404040',
                      anchor: new google.maps.Point(10, 30),
                      rotation: this.getBearingBetweenTwoPoints(new google.maps.LatLng(response.routes[0].overview_path[response.routes[0].overview_path.length-2].lat(), response.routes[0].overview_path[response.routes[0].overview_path.length-2].lng()), new google.maps.LatLng(response.routes[0].overview_path[response.routes[0].overview_path.length-1].lat(), response.routes[0].overview_path[response.routes[0].overview_path.length-1].lng()))
                    },
                  });
  
                  this.markers.push(marker);
                  this.setMapOnAll(this.map);
                }

                this.totalKm = this.totalKm + (response?.routes[0]?.legs[0]?.distance?.value / 1000);
  
                directionsDisplay.setDirections(response);
              }else {
                console.log('Impossible d afficher la route ' + status)
              }
            }));
          }
        }));
      }
    }));

    this.numberOfStore = paybackArr.length;
    this.numberOfOrder = paybackArr.length;
  }
}
