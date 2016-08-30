// Redimensionar o mapa para ficar na tela toda
$(document).ready(function () {
    var bodyheight = $(window).height();
    $("#googleMap").height(bodyheight - 51);
});

// for the window resize
$(window).resize(function () {
    var bodyheight = $(window).height();
    $("#googleMap").height(bodyheight - 51);
});

// the main firebase reference
var rootRef = new Firebase('https://meuposto.firebaseio.com/web/uauth');

function VerificarUsuarioLogado() {
    var usuarioLogado = rootRef.getAuth();
    var usuarioLogadoBool = (usuarioLogado != undefined)
    return usuarioLogadoBool;
}

var map;
var opendInfoWindow;
var sorompilo;
var all_markers = {};
var all_markers_keys = [];
var queryStr = '';

function carregarPostos() {
    var bounds = map.getBounds();
    var latMin = bounds.getSouthWest().lat().toString();
    var latMax = bounds.getNorthEast().lat().toString();
    var lngMin = bounds.getSouthWest().lng().toString();
    var lngMax = bounds.getNorthEast().lng().toString();
    queryStr = '?latMin=' + latMin + "&latMax=" + latMax + "&lngMin=" + lngMin + "&lngMax=" + lngMax;

    jQuery.ajax({
        //url: 'py/recuperar-postos.py' + queryStr,
        url: 'http://yitzhakstone.pythonanywhere.com/MeuPosto/api/recuperar-postos' + queryStr,
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            data.forEach(AddMarker);
        },
        failure: function (msg) { alert("Ocorreu um erro !!! "); }
    });
}

function avaliarPosto(idPosto, nota) {
    if (!VerificarUsuarioLogado()) {
        alert('Entre ou cadastre-se para avaliar os postos.');
        return false;
    }

    var uid = rootRef.getAuth().uid;

    if (nota == null) {
        DeletarNota(uid, idPosto);
        alert('Avaliação cancelada.');

        // Ao cancelar, define o score das estrelas com a nota média
        var notaMedia = $('#AvalPosto' + this.id).attr('data-notaMedia');
        $('#AvalPosto' + idPosto).raty('set', { score: notaMedia });
        
    } else {
        CadastrarNota(uid, idPosto, nota);
        alert(nota.toString() + ' estrelas.');
    }
    return true;
}

function CadastrarNota(uid, idposto, nota) {
    queryStr = '?uid=' + uid + "&idposto=" + idposto + "&nota=" + nota;
    jQuery.ajax({
        url: 'py/avaliar-posto.py' + queryStr,
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            console.log(data);
        },
        failure: function (msg) { alert("Ocorreu um erro !!! "); }
    });
}

function DeletarNota(uid, idposto) {
    queryStr = '?uid=' + uid + "&idposto=" + idposto;
    jQuery.ajax({
        url: 'py/deletar-avaliacao-posto.py' + queryStr,
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            console.log(data);
        },
        failure: function (msg) { alert("Ocorreu um erro !!! "); }
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

    var nota = value.Avaliacao != 'None' ? parseFloat(value.Avaliacao).toFixed(1) : 'Sem nota';

    var modalPosto = '\
        <div id="modalPosto' + value.ID + '" class="modal fade" role="dialog">\
            <div class="modal-dialog">\
                <div class="modal-content">\
                    <div class="modal-header">\
                        <button type="button" class="close" data-dismiss="modal">&times;</button>\
                        <h4 class="modal-title">[' + value.ID + '] ' + value.Nome + '</h4>\
                    </div>\
                    <div class="modal-body">\
                        <p>' + value.Logr + ', ' + value.Num + ' - ' + value.Bairro + '</p>\
                        <p>\
                            <div style="display: inline-block;"\
                                id="AvalPosto' + value.ID + '"\
                                data-idPosto="' + value.ID + '"\
                                data-path="lib/raty-2.7.0/images/red"\
                                data-notaMedia="' + value.Avaliacao + '\
                                data-notaUser="' + value.Avaliacao + '"></div>\
                            <div style="display: inline-block; margin-left: 5px;">(Média: ' + nota + ')</div>\
                        </p>\
                        <p><table class="preco-comb">\
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
                        </table></p>\
                        <p><a href="#" onClick="tracarRota(\'' + value.Lat + ', ' + value.Lng + '\')">Rota</a></p>\
                    </div>\
                    <div class="modal-footer">\
                        <button type="button" class="btn btn-default" data-dismiss="modal">Fechar</button>\
                    </div>\
                </div>\
            </div>\
        </div>';

    $('#modaisPostos').append(modalPosto);

    marker.set("idPosto", value.ID);

    // abre modal com as info do posto ao clicar no marker
    marker.addListener('click', function () {

        // Recupera o id do posto
        var idPosto = this.get("idPosto");

        $('#modalPosto' + idPosto).modal();

        // Inicializa as estrelinhas!
        $('#AvalPosto' + idPosto).raty({
            // Quantas estrelas vão aparecer marcadas
            score: function() {
                var scoreUser = $(this).attr('data-notaUser');
                var scoreAvg = $(this).attr('data-notaMedia');
                if (scoreUser != undefined){
                    return scoreUser;
                } else {
                    return scoreAvg;
                }
            },
            // Evento ao avaliar
            click: function(score, evt) {
                var idPostoRaty = $('#' + this.id).attr('data-idPosto')
                return avaliarPosto(idPostoRaty, score);
            },
            // Botão de cancelar avaliação
            cancel: true
        });

    });

    all_markers[value.ID] = marker;
    all_markers_keys.push(value.ID);

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

    //alert('Tentando definir posição do  usuário...');

    /* localização */
    // Try W3C Geolocation (Preferred)
    if (navigator.geolocation) {
        
        //alert('Navegador suporta geo-localização.');

        browserSupportFlag = true;
        navigator.geolocation.getCurrentPosition(function (position) {
            
            //alert('Eutrou na função.');

            initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            sorompilo = initialLocation;
            map.setCenter(initialLocation);
            MarcarUser(initialLocation);
            queryStr = 'lat=' + position.coords.latitude.toString() + "&lng=" + position.coords.longitude.toString();
        }, function () {
            
            //alert('call handleNoGeolocation');

            handleNoGeolocation(browserSupportFlag);
        });
    }
        // Browser doesn't support Geolocation
    else {
        browserSupportFlag = false;
        
        alert('Seu navegador não possui o recurso de geo-localização. Alguns recursos não estarão disponíveis');

        handleNoGeolocation(browserSupportFlag);
    }

    function handleNoGeolocation(errorFlag) {
        if (errorFlag == true) {
            console.log("Geolocation service failed.");
            initialLocation = {lat:-19.916681, lng:-43.934493}; // Belo Horizonte
        } else {
            alert("Your browser doesn't support geolocation. We've placed you in Belo Horizonte.");
            initialLocation = {lat:-19.916681, lng:-43.934493}; // Belo Horizonte
        }
        //alert(errorFlag);
        map.setCenter(initialLocation);
    }

    function MarcarUser(userPosition) {
        var marker = new google.maps.Marker({
            map: map,
            clickable: false,
            shadow: null,
            zIndex: 999,
            position: userPosition,
            title: 'eu',
            icon: new google.maps.MarkerImage('//maps.gstatic.com/mapfiles/mobile/mobileimgs2.png',
            new google.maps.Size(22,22),
            new google.maps.Point(0,18),
            new google.maps.Point(11,11))
        });
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

function RedefinirIcones() {

    all_markers_keys.forEach( function(idposto) {
        all_markers[idposto].setIcon();
    });

}

function BuscarMelhor() {

    RedefinirIcones();

    if (sorompilo == undefined) {
        console.log('Não foi possível recuperar sua localização, utilizando Belo Horizonte.');
        sorompilo = {lat:-19.916681, lng:-43.934493}; // Belo Horizonte
        //return;
    }

    lat = sorompilo.lat();
    lng = sorompilo.lng()
    queryStr = '?lat=' + lat.toString() + "&lng=" + lng.toString();

    jQuery.ajax({
        url: 'py/calcular-melhor-posto.py' + queryStr,
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            data.forEach(MarcarMelhores);
        },
        failure: function (msg) { alert("Ocorreu um erro !!! "); }
    });

}

function MarcarMelhores(data, ix) {
    var iconText = ix + 1;
    var iconPath = "http://mt.google.com/vt/icon?psize=16&font=fonts/Roboto-Regular.ttf&color=ff330000&name=icons/spotlight/spotlight-waypoint-a.png&ax=44&ay=48&scale=1&text=" + iconText.toString();

    if (ix < 5) {
        all_markers[data.ID].setIcon(iconPath);
    }
}

$(document).ready(function () {
    $("#btn-buscar-melhor").click(function(e) {
        e.preventDefault();
        BuscarMelhor();
    });
});
