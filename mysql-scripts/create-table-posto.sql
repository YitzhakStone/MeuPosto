USE MeuPosto;

CREATE TABLE Posto(
	ID int PRIMARY KEY AUTO_INCREMENT NOT NULL,
	CNPJ char(14) NULL,
	Nome varchar(200) NOT NULL,
	Logr varchar(200) NULL,
	Num int NULL,
	Bairro varchar(100) NULL,
	CEP char(8) NULL,
	Lat decimal(10, 8) NULL,
	Lng decimal(10, 8) NULL
);



