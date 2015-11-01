#!/usr/bin/python
# -*- coding: utf-8 -*-

import MySQLdb
import json
import collections
import cgi, cgitb 

#cgitb.enable()  # for troubleshooting

# get input (POST)

data = cgi.FieldStorage()
jsonin = str(data.value)

# separate params of input

jsonin = jsonin.replace("(", "").replace(")", "").replace(" ", "");
coords = jsonin.split(',');
latMin = coords[0];
lngMin = coords[1];
latMax = coords[2];
lngMax = coords[3];

db = MySQLdb.connect(host="localhost", user="root", passwd="balde", db="MeuPosto")
cur = db.cursor() 

cur.execute(""" 
  SELECT 
    P.ID, P.Nome, P.Logr, P.Num, P.Bairro, P.Lat, P.Lng, A.Avaliacao 
  FROM 
    Posto P LEFT JOIN 
    PostoAvaliacao A ON P.ID = A.IDPosto 
  WHERE """
    "P.Lat BETWEEN " + latMin + " AND " + latMax + " AND "
    "P.Lng BETWEEN " + lngMin + " AND " + lngMax + " "
  ";")

rows = cur.fetchall()

# Convert query to row arrays

rowarray_list = []
for row in rows:
    t = (row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7])
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
    d['Avaliacao'] = row[7]
    objects_list.append(d)

# convert to json

j = json.dumps(objects_list, encoding='ISO-8859-1')

# output

print "Content-type: application/json\n\n"
print j