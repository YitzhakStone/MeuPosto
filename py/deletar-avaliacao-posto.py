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

db = MySQLdb.connect(host="localhost", user="root", passwd="balde", db="MeuPosto")
cur = db.cursor()

query = """
	DELETE FROM PostoAvaliacao
	WHERE IDPosto = """ + idposto + " AND IDUsuario = '" + uid + "';"

cur.execute(query)
db.commit();
linhasAfetadas = str(cur.rowcount)

# output
print "Content-type: application/json\n\n"
print linhasAfetadas
