#!/usr/bin/python
# -*- coding: utf-8 -*-

import MySQLdb
import json
import collections
import cgi, cgitb 

cgitb.enable()  # for troubleshooting

data = cgi.FieldStorage()

jsonin = str(data.value)

jsonin = jsonin.replace("(", "").replace(")", "").replace(" ", "");
coords = jsonin.split(',');

latMin = coords[0];
lngMin = coords[1];
latMax = coords[2];
lngMax = coords[3];

db = MySQLdb.connect(host="localhost", # your host, usually localhost
                     user="root", # your username
                      passwd="balde", # your password
                      db="MeuPosto") # name of the data base

# you must create a Cursor object. It will let
#  you execute all the queries you need
cur = db.cursor() 

# Use all the SQL you like
cur.execute("SELECT ID, Nome, Logr, Num, Bairro, Lat, Lng FROM Posto WHERE Lat BETWEEN " + latMin + " AND " + latMax + " AND Lng BETWEEN " + lngMin + " AND " + lngMax + " ;")

rows = cur.fetchall()

# Convert query to row arrays

rowarray_list = []
for row in rows:
    t = (row[0], row[1], row[2], row[3], row[4], row[5], row[6])
    rowarray_list.append(t)

#j = json.dumps(rowarray_list)
#rowarrays_file = 'student_rowarrays.js'
#f = open(rowarrays_file,'w')
#print >> f, j

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
    objects_list.append(d)
 
j = json.dumps(objects_list, encoding='ISO-8859-1')
#objects_file = 'student_objects.js'
#f = open(objects_file,'w')
#print >> f, j

#print "Content-type: text/html"
print "Content-type: application/json\n\n"
print j