#!/usr/bin/python
# -*- coding: utf-8 -*-

import MySQLdb
import json
import collections
import cgi, cgitb 

# for troubleshooting
cgitb.enable()

# get input
data = cgi.FieldStorage()
latMin = data["latMin"].value
latMax = data["latMax"].value
lngMin = data["lngMin"].value
lngMax = data["lngMax"].value

# executa comandos no sql
db = MySQLdb.connect(host="localhost", user="root", passwd="balde", db="MeuPosto")
cur = db.cursor()

cur.execute("""
  SELECT
    P.ID, P.Nome, P.Logr, P.Num, P.Bairro, P.Lat, P.Lng, T.Avaliacao,
    (SELECT C.Valor FROM PostoCombustivel C WHERE C.IDPosto = P.ID AND C.IDComb = 1) AS ValorAlcool,
    (SELECT C.Valor FROM PostoCombustivel C WHERE C.IDPosto = P.ID AND C.IDComb = 2) AS ValorGasolina,
    (SELECT C.Valor FROM PostoCombustivel C WHERE C.IDPosto = P.ID AND C.IDComb = 3) AS ValorGNV,
    (SELECT C.Valor FROM PostoCombustivel C WHERE C.IDPosto = P.ID AND C.IDComb = 4) AS ValorDiesel,
    (SELECT C.Valor FROM PostoCombustivel C WHERE C.IDPosto = P.ID AND C.IDComb = 5) AS ValorGasolinaAdt,
    (SELECT C.Valor FROM PostoCombustivel C WHERE C.IDPosto = P.ID AND C.IDComb = 6) AS ValorGasolinaPremium
  FROM
    Posto P LEFT JOIN
    (
    SELECT A.IDPosto, AVG(A.Avaliacao) AS Avaliacao FROM PostoAvaliacao A GROUP BY A.IDPosto
    ) AS T ON T.IDPosto = P.ID
  WHERE """
    "P.Lat BETWEEN " + latMin + " AND " + latMax + " AND "
    "P.Lng BETWEEN " + lngMin + " AND " + lngMax + " "
  ";")

rows = cur.fetchall()

# Convert query to row arrays

rowarray_list = []
for row in rows:
    t = (row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[9], row[10], row[11], row[12], row[13])
    rowarray_list.append(t)

# Convert query to objects of key-value pairs

objects_list = []
for row in rows:

    d = collections.OrderedDict()
    d['ID'] = row[0]
    d['Nome'] = row[1]
    d['Logr'] = row[2]
    d['Num'] = row[3]
    d['Bairro'] = row[4]
    d['Lat'] = str(row[5])
    d['Lng'] = str(row[6])
    d['Avaliacao'] = str(row[7])
    d['ValorAlcool'] = str(row[8])
    d['ValorGasolina'] = str(row[9])
    d['ValorGNV'] = str(row[10])
    d['ValorDiesel'] = str(row[11])
    d['ValorGasolinaAdt'] = str(row[12])
    d['ValorGasolinaPremium'] = str(row[13])
    objects_list.append(d)

# convert to json

j = json.dumps(objects_list, encoding='ISO-8859-1')

# output

print "Content-type: application/json\n\n"
print j
