
select * from Posto 
where 
lat between '-19.88' and '-19.85' and
lng between '-43.93' and '-43.91'

--select * from PostoAvaliacao
--update PostoAvaliacao set avaliacao = 5 where avaliacao = 6
--delete PostoAvaliacao where idusuario = 1

--select idposto, avg(avaliacao) from PostoAvaliacao group by idposto;

--select avaliacao, count(avaliacao) from PostoAvaliacao group by avaliacao;