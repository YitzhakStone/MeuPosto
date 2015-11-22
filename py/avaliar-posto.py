#!/usr/bin/python
# -*- coding: utf-8 -*-

import MySQLdb
import json
import cgi, cgitb 

#########################################
# Inicio
#########################################

# http://localhost/MeuPosto/py/avaliar-posto.py?uid=e0b67871-8765-4a7e-88fb-bdf50de4d7aa&idposto=171&nota=1

# for troubleshooting
cgitb.enable()
#print "Content-type: text/html\n\n"

# get input (query string)
data = cgi.FieldStorage()
uid = data["uid"].value
idposto = data["idposto"].value
nota = data["nota"].value

db = MySQLdb.connect(host="localhost", user="root", passwd="balde", db="MeuPosto")
cur = db.cursor()

query = """
    INSERT INTO PostoAvaliacao (IDPosto, IDUsuario, Avaliacao)
    VALUES (""" + idposto + ", '" + uid + "', " + nota + """)
    ON DUPLICATE KEY UPDATE 
    Avaliacao=VALUES(Avaliacao);"""

cur.execute(query)
db.commit();
linhasAfetadas = str(cur.rowcount)
'''
With ON DUPLICATE KEY UPDATE, the affected-rows value per row is: 
    1 if the row is inserted as a new row;
    2 if an existing row is updated.
'''

# output
print "Content-type: application/json\n\n"
print linhasAfetadas
