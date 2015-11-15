// Redimensionar o mapa para ficar na tela toda
$(document).ready(function () {
    var bodyheight = $(window).height();
    $("#googleMap").height(bodyheight - 70);
});

// for the window resize
$(window).resize(function () {
    var bodyheight = $(window).height();
    $("#googleMap").height(bodyheight - 70);
});

var map;
var opendInfoWindow;
var sorompilo;
var all_markers = {};
var queryStr = '';

function carregarPostos() {
    var bounds = map.getBounds();
    var latMin = bounds.O.O.toString()
    var latMax = bounds.O.j.toString();
    var lngMin = bounds.j.j.toString();
    var lngMax = bounds.j.O.toString();
    queryStr = '?latMin=' + latMin + "&latMax=" + latMax + "&lngMin=" + lngMin + "&lngMax=" + lngMax;

    jQuery.ajax({
        url: 'py/recuperar-postos.py' + queryStr,
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            data.forEach(AddMarker);
        },
        failure: function (msg) { alert("Ocorreu um erro !!! "); }
    });
}

function avaliar(idPosto, nota) {
    if (nota == null) {
        alert('Avaliação cancelada.');
        // Ao cancelar, define o score das estrelas com a nota média
        var notaMedia = $('#AvalPosto' + this.id).attr('data-notaMedia');
        $('#AvalPosto' + idPosto).raty('set', { score: notaMedia });
        // chamar função para deletar a avaliação do usuário no banco
    } else {
        alert(nota.toString() + ' estrelas.');
        // chamar função para inserir a avaliação do usuário no banco
    }
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

    var nota = value.Avaliacao != 'None' ? parseFloat(value.Avaliacao).toFixed(1) : 'Sem nota';

    // HTML do balãozinho do posto
    var infowindow = new google.maps.InfoWindow({
        content: 
            '<a class="idposto" style="display:none">' + value.ID + '</a>\
            <b>[' + value.ID + '] ' + value.Nome + '</b>\
            <br>' + value.Logr + ', ' + value.Num + ' - ' + value.Bairro + '\
            <div>\
                <div style="display: inline-block;"\
                    id="AvalPosto' + value.ID + '"\
                    data-score="' + value.Avaliacao + '"\
                    data-idPosto="' + value.ID + '"\
                    data-notaMedia="' + value.Avaliacao + '"></div>\
                <div style="display: inline-block; margin-left: 5px;">(Média: ' + nota + ')</div>\
            </div><br />\
                <table class="preco-comb">\
                    <tr>\
                        <th>G</th>\
                        <th>A</th>\
                        <th>D</th>\
                        <th>GNV</th>\
                        <th>GA</th>\
                        <th>GP</th>\
                    </tr>\
                    <tr>\
                        <td>' + value.ValorGasolina.replace("None", "-")        + '</td>\
                        <td>' + value.ValorAlcool.replace("None", "-")          + '</td>\
                        <td>' + value.ValorDiesel.replace("None", "-")          + '</td>\
                        <td>' + value.ValorGNV.replace("None", "-")             + '</td>\
                        <td>' + value.ValorGasolinaAdt.replace("None", "-")     + '</td>\
                        <td>' + value.ValorGasolinaPremium.replace("None", "-") + '</td>\
                    </tr>\
                </table>\
            <br />\
            <a href="#" onClick="tracarRota(\'' + value.Lat + ', ' + value.Lng + '\')">Rota</a>'
    });

    // preencher o conteúdo do balão a cada clique. utiliza apenas um 'infowindow'
    //google.maps.event.addListener(someMarker, 'click', function () {
    //    infowindow.setContent('Hello World');
    //    infowindow.open(map, this);
    //});

    // abre balão de info ao clicar no marker e fecha o balão que estiver aberto
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
        $('#AvalPosto' + idPosto).raty({
            // Quantas estrelas vão aparecer marcadas
            score: function() {
                return $(this).attr('data-score');
            },
            // Evento ao avaliar
            click: function(score, evt) {
                var idPostoRaty = $('#' + this.id).attr('data-idPosto')
                avaliar(idPostoRaty, score);
            },
            // Botão de cancelar avaliação
            cancel: true
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
function tracarRota(enderAte) {
    var directionsService;
    var directionsRenderer;

    directionsService = new google.maps.DirectionsService();

    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    /* pegar localização atual */
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            //enderDe = position.coords.latitude + ", " + position.coords.longitude;
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
        queryStr = '?lat=' + latcenter.toString() + "&lng=" + lngcenter.toString();

        window.open('py/calcular-melhor-posto.py' + queryStr);
        
    });
});