USE MeuPosto;

CREATE TABLE PostoAvaliacao(
	ID int PRIMARY KEY AUTO_INCREMENT NOT NULL,
	IDPosto int NOT NULL,
	IDUsuario int NULL,
	Avaliacao smallint NOT NULL,
	CONSTRAINT UQ_PostoAvaliacao UNIQUE (IDPosto, IDUsuario)
);