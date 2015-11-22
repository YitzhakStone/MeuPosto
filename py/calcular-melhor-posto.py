#!/usr/bin/python
# -*- coding: utf-8 -*-

import MySQLdb
import collections
import googlemaps
import json
import cgi, cgitb 
import decimal

# Preencher com chave da API do GMaps
client = googlemaps.Client('AIzaSyAkUbsC-g6QhmpIbKtC9Mr11cGziUKZBKw')

#########################################
# Normalizar
#########################################
def Normalizar(_valMin, _valMax, _val):
    if _val == None: return None
    difT = _valMax - _valMin
    difV = _valMax - _val
    if difT == 0: return 1
    val = float(difV) / float(difT)
    return val

def NormalizarNota(_nota):
    if _nota == None: _nota = 3.0
    notaNorm = float(_nota) / 5.0
    return notaNorm

def CalcularValor(_dist, _preco, _nota):
    valor = ((_dist if _dist != None else 0) + (_preco if _preco != None else 0) + (_nota if _nota != None else 0)) / 3
    return valor

#########################################
# Inicio
#########################################

# -19.8858353802915, -43.92804398029149 # usado para testes
# http://localhost/MeuPosto/py/teste.py?lat=-19.8858353802915&lng=-43.92804398029149

# for troubleshooting
cgitb.enable()
#print "Content-type: text/html\n\n"

# get input (query string)
data = cgi.FieldStorage()
lat = data["lat"].value
lng = data["lng"].value

#print '<br>'
#print lat
#print '<br>'
#print lng
#print '<br>'
#print '<br>'

# prepara variaveis iniciais
userLat = float(lat);
userLng = float(lng);

# Valores para normalizar os preços
valMinGas = 9999.0
valMaxGas = 0.0

# Controle da iteração
raioIncrement = 0.005
countIncrement = 1
qtdePostosRet = int(0)

while (qtdePostosRet < 5 and countIncrement < 10):

    latMin = userLat - (raioIncrement * countIncrement);
    lngMin = userLng - (raioIncrement * countIncrement);
    latMax = userLat + (raioIncrement * countIncrement);
    lngMax = userLng + (raioIncrement * countIncrement);

    countIncrement = countIncrement + 1

    db = MySQLdb.connect(host="localhost", user="root", passwd="balde", db="MeuPosto")
    cur = db.cursor()

    cur.execute("""
        SELECT
            P.ID, P.Nome, P.Logr, P.Num, P.Bairro, P.Lat, P.Lng, T.Avaliacao,
            (SELECT C.Valor FROM PostoCombustivel C WHERE C.IDPosto = P.ID AND C.IDComb = 1) AS Valor_Alcool,
            (SELECT C.Valor FROM PostoCombustivel C WHERE C.IDPosto = P.ID AND C.IDComb = 2) AS Valor_Gasolina,
            (SELECT C.Valor FROM PostoCombustivel C WHERE C.IDPosto = P.ID AND C.IDComb = 3) AS Valor_GNV,
            (SELECT C.Valor FROM PostoCombustivel C WHERE C.IDPosto = P.ID AND C.IDComb = 4) AS Valor_Diesel,
            (SELECT C.Valor FROM PostoCombustivel C WHERE C.IDPosto = P.ID AND C.IDComb = 5) AS Valor_GasolinaAdt,
            (SELECT C.Valor FROM PostoCombustivel C WHERE C.IDPosto = P.ID AND C.IDComb = 6) AS Valor_GasolinaPremium
        FROM
            Posto P LEFT JOIN
            (
                SELECT A.IDPosto, AVG(A.Avaliacao) AS Avaliacao FROM PostoAvaliacao A GROUP BY A.IDPosto
            ) AS T ON T.IDPosto = P.ID
        WHERE """
            "P.Lat BETWEEN " + str(latMin) + " AND " + str(latMax) + " AND "
            "P.Lng BETWEEN " + str(lngMin) + " AND " + str(lngMax) + " "
        ";")

    rows = cur.fetchall()
    qtdePostosRet = len(rows)

    postos = collections.OrderedDict()
    for row in rows:
        d = collections.OrderedDict()
        d['ID'] = row[0]
        d['Nome'] = row[1]
        d['Logr'] = row[2]
        d['Num'] = row[3]
        d['Bairro'] = row[4]
        d['Lat'] = str(row[5])
        d['Lng'] = str(row[6])
        d['Avaliacao'] = row[7]
        d['ValorAlcool'] = str(row[8])

        d['ValorGasolina'] = float(row[9]) if row[9] != None else None
        valMinGas = d['ValorGasolina'] if d['ValorGasolina'] != None and d['ValorGasolina'] < valMinGas else valMinGas
        valMaxGas = d['ValorGasolina'] if d['ValorGasolina'] > valMaxGas else valMaxGas

        d['ValorGNV'] = str(row[10])
        d['ValorDiesel'] = str(row[11])
        d['ValorGasolinaAdt'] = str(row[12])
        d['ValorGasolinaPremium'] = str(row[13])

        # Não retornar postos sem preço de gasolina.
        if d['ValorGasolina'] != None:
            postos[str(d['ID'])] = d

########################################################
# Calcular distância dos postos e normalizar valores
########################################################

# Valores para normalizar as distâncias
distMin = 999999999
distMax = 0

# Valores de entrada para a API do GMaps (recuperar distancias)
origins = [lat + ', ' + lng]
destinations = []

# Concatena endereços e joga num array para busca de distancia na API do GMaps
for k, v in postos.iteritems():
    #endereco = v['Logr'] + ', ' + str(v['Num']) + ', ' + v['Bairro'] + ' Belo Horizonte, MG'
    endereco = str(v['Lat']) + ', ' + str(v['Lng'])
    destinations.append(endereco)

# Calcula a distancia
matrix = client.distance_matrix(origins, destinations)

# Array auxiliar para armazenar as distancias em metros
distancias = []

# Percorre o resultado da API GMaps recuperando a distancia de cada posto
for r in matrix['rows'][0]['elements']:
    if r['status'] == 'OK':        
        distAux = int(r['distance']['value'])
        distancias.append(distAux)

        if distAux < distMin:
            distMin = distAux
        if distAux > distMax:
            distMax = distAux
    else:
        distancias.append(None)

# Coloca a distância em seu respectivo posto e calcula os valores normalizados
dist_i = 0
for k, v in postos.iteritems():
    v['Distancia'] = distancias[dist_i]

    v['Distancia_Norm'] = Normalizar(distMin, distMax, v['Distancia'])    
    v['ValorGasolina_Norm'] = Normalizar(valMinGas, valMaxGas, v['ValorGasolina'])
    v['Avaliacao_Norm'] = NormalizarNota(v['Avaliacao'])

    v['NotaFinal'] = CalcularValor(float(v['Distancia_Norm']), float(v['ValorGasolina_Norm']), float(v['Avaliacao_Norm']))

    dist_i = dist_i + 1

'''
# Testar exibindo na tela os resultados
print "Content-type: text/html\n\n"
for k, r in postos.iteritems():
    print '<br>'
    print r['Nome'] + ' - Nota final: ' + str(r['NotaFinal'])
    print '<br>'
    print 'Nota: ' +  str(r['Avaliacao']) + ' - Nota Norm: ' + str(r['Avaliacao_Norm'])
    print '<br>'
    print 'ValGas: ' + str(r['ValorGasolina']) + ' - ValGasNorm: ' + str(r['ValorGasolina_Norm'])
    print '<br>'
    print 'Dist: ' + str(r['Distancia']) + ' - DistNorm: ' + str(r['Distancia_Norm'])
    print '<br>'
print '<br>'
print '<br>'
print '<br>'
'''

postosOrdenados = collections.OrderedDict()
for key, value in sorted(postos.iteritems(), key=lambda (k,v): (v['NotaFinal']*(-1), k)):
    postosOrdenados[str(value['ID'])] = value
    '''
    print "%s: %s" % (key, value)
    print '<br>'
    print '<br>'
    '''

'''
print '<br>'
print '<br>'
print '<br>'
'''

# Necessário para converter valores decimais no JSON
import decimal, simplejson
class DecimalJSONEncoder(simplejson.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            return str(o)
        return super(DecimalJSONEncoder, self).default(o)

# convert to json
j = simplejson.dumps(postosOrdenados, cls=DecimalJSONEncoder, encoding='ISO-8859-1')

# output
print "Content-type: application/json\n\n"
print j
