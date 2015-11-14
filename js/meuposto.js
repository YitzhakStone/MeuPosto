// Redimensionar o mapa para ficar na tela toda
$(document).ready(function () {
    var bodyheight = $(window).height();
    $("#googleMap").height(bodyheight - 50);
});

// for the window resize
$(window).resize(function () {
    var bodyheight = $(window).height();
    $("#googleMap").height(bodyheight - 50);
});

var map;
var opendInfoWindow;
var sorompilo;
var all_markers = {};
var queryStr = '';

function carregarPostos() {
    var bounds = map.getBounds();
    jQuery.ajax({
        url: 'py/recuperar-postos.py',
        type: "POST",
        //data: "{'teste' : " + "'" + bounds + "'" + "}",
        data: bounds.toString(),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        beforeSend: function () {
            //alert("Start!!! ");
        },
        success: function (data) {
            data.forEach(AddMarker);
        },
        failure: function (msg) { alert("Sorry!!! "); }
    });
}

function AddMarker(value, index, ar) {

    //$('#rating' + value.ID.toString()).rating();

    if (all_markers[value.ID] != undefined)
    {
        return;
    }

    // Create a marker and set its position.
    var myLatLng = { lat: parseFloat(value.Lat), lng: parseFloat(value.Lng) };
    var marker = new google.maps.Marker({
        map: map,
        position: myLatLng,
        title: value.Nome
    });

    var nota = value.Avaliacao != null ? value.Avaliacao + ' / 5' : 'Sem nota';

    var infowindow = new google.maps.InfoWindow({
        content: 
            '<a class="idposto" style="display:none">' + value.ID + '</a>\
            <b>' + value.Nome + '</b>\
            <br>' + value.Logr + ', ' + value.Num + ' - ' + value.Bairro + '\
            <br /><br />Nota: ' + nota + '\
            <div id="rating' + value.ID + '" class="rating" style="display:none;" \
                title="Nota Média: ' + value.Avaliacao + '" >\
                <input type="number" class="rating" value="4" >\
            </div>\
            <br />\
                <table><tr><th>Gasolina</th><th>Álcool</th><th>Diesel</th><th>GNV</th><th>Gas.Adt.</th><th>Gas.Premium</th></tr>\
                <tr>' + '<td>' + value.ValorGasolina + '</td><td>' + value.ValorAlcool + '</td><td>' + value.ValorDiesel + '</td><td>' + value.ValorGNV + '</td><td>' + value.ValorGasolinaAdt + '</td><td>' + value.ValorGasolinaPremium + '</td></tr>\
                </table>\
            <br />\
            <a href="#" onClick="tracarRota(\'\', \'' + value.Lat + ', ' + value.Lng + '\')">Rota</a>'
    });

    // preencher o conteúdo do balão a cada clique. utiliza apenas um 'infowindow'
    //google.maps.event.addListener(someMarker, 'click', function () {
    //    infowindow.setContent('Hello World');
    //    infowindow.open(map, this);
    //});

    // abre balão de info ao clicar no marker
    // e fecha o balão que estiver aberto
    marker.addListener('click', function () {

        if (opendInfoWindow != undefined) {
            opendInfoWindow.close();
            //return;
        }
        infowindow.open(map, marker);
        opendInfoWindow = infowindow;

        // html que estará dentro do balão
        var htmlString = opendInfoWindow.content
          , parser = new DOMParser()
          , doc = parser.parseFromString(htmlString, "text/html");

        // Recupera o id do posto
        var idPosto = $('a.idposto').html();

        // Inicializa as estrelinhas!
        //$('#rating' + idPosto).rating();


        $('#rating' +idPosto).rating({
              min: 0,
              max: 5,
              step: 1,
              size: 'xxs'
           });

    });

    all_markers[value.ID] = marker;

}

function initialize() {
    var mapProp = {
        center: new google.maps.LatLng(-19.858139, -43.919193),
        zoom: 15,
        panControl: true,
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: false,
        streetViewControl: false,
        overviewMapControl: false,
        rotateControl: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("googleMap"), mapProp);
    //google.maps.event.addListenerOnce(map, 'idle', carregarTodosOsPostos);
    google.maps.event.addListener(map, 'idle', carregarPostos);

    /* localização */
    // Try W3C Geolocation (Preferred)
    if (navigator.geolocation) {
        browserSupportFlag = true;
        navigator.geolocation.getCurrentPosition(function (position) {
            initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            sorompilo = initialLocation;
            map.setCenter(initialLocation);
            queryStr = 'lat=' + position.coords.latitude.toString() + "&lng=" + position.coords.longitude.toString();
        }, function () {
            handleNoGeolocation(browserSupportFlag);
        });
    }
        // Browser doesn't support Geolocation
    else {
        browserSupportFlag = false;
        handleNoGeolocation(browserSupportFlag);
    }

    function handleNoGeolocation(errorFlag) {
        if (errorFlag == true) {
            alert("Geolocation service failed.");
            initialLocation = newyork;
        } else {
            alert("Your browser doesn't support geolocation. We've placed you in Siberia.");
            initialLocation = siberia;
        }
        map.setCenter(initialLocation);
    }
    /* fim localização */

}
google.maps.event.addDomListener(window, 'load', initialize);


/* traçar rota */
function tracarRota(enderDe, enderAte) {
    var directionsService;
    var directionsRenderer;

    directionsService = new google.maps.DirectionsService();

    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    /* pegar localização atual */
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            enderDe = position.coords.latitude + ", " + position.coords.longitude;
        }, function () {
        });
    }
    /* fim pegar localização atual */

    //directionsDisplay.setMap(null);

    var request = {
        origin: sorompilo,
        destination: enderAte,
        travelMode: google.maps.DirectionsTravelMode.DRIVING
    };

    directionsService.route(request, function (response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(response);
        }
    });
}
/* fim traçar rota */

$(document).ready(function () {
    $("#buscar-melhor").click(function(e) {
        e.preventDefault();

        latcenter = map.getCenter().lat();
        lngcenter = map.getCenter().lng()
        queryStr = 'lat=' + latcenter.toString() + "&lng=" + lngcenter.toString();

        window.open('py/calcular-melhor-posto.py?' + queryStr);
        
    });
});