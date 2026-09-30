import { initializeApp, getAuth, signInAnonymously, onAuthStateChanged, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, setDoc, onSnapshot, collection, query, where, orderBy, limit, getDocs } from "./firebase.js";

const firebaseConfig = {
  apiKey: "AIzaSyBGWkju71fECEfizymK9dU0v_Wi6IAV0lU",
  authDomain: "borracharia-albras.firebaseapp.com",
  projectId: "borracharia-albras",
  storageBucket: "borracharia-albras.firebasestorage.app",
  messagingSenderId: "519309613823",
  appId: "1:519309613823:web:d445b38f76ae64d94bcaca"
};

/* Listas padrão (usadas até o Firestore responder, e se não houver versão no banco) */
const EQUIP_PADRAO = [{"local": "80903054", "tag": "CE-91141", "descricao": "CARRO ELETRICO", "familia": "Carro elétrico", "area": "FAV"}, {"local": "80920615", "tag": "CO-91701", "descricao": "CAMINHAO BOMBEIRO", "familia": "Caminhão bombeiro", "area": "HSS"}, {"local": "80921550", "tag": "CO-91703", "descricao": "CAMINHAO BOMBEIRO", "familia": "Caminhão bombeiro", "area": "HSS"}, {"local": "80925228", "tag": "CE-91128", "descricao": "CARRO ELETRICO", "familia": "Carro elétrico", "area": "Subestação"}, {"local": "80925625", "tag": "GE517001", "descricao": "GERADOR EMERG 2425KW TOSHIBA", "familia": "Gerador de emergência", "area": "Subestação"}, {"local": "80925626", "tag": "GE517002", "descricao": "GERADOR EMERG 2425KW TOSHIBA", "familia": "Gerador de emergência", "area": "Subestação"}, {"local": "80903053", "tag": "CE-91132", "descricao": "CARRO ELETRICO", "familia": "Carro elétrico", "area": "Manutenção FAV"}, {"local": "80902209", "tag": "CE-91127", "descricao": "CARRO ELETRICO", "familia": "Carro elétrico", "area": "OCH"}, {"local": "80905455", "tag": "CE-91110", "descricao": "CARRO ELETRICO", "familia": "Carro elétrico", "area": "Fundição"}, {"local": "80920519", "tag": "EP-91559", "descricao": "EMPILHADEIRA TOYOTA FSV 4.3(7T)", "familia": "Empilhadeira", "area": "Fundição"}, {"local": "80904458", "tag": "SH-91219", "descricao": "PA CARREGADEIRA 924G", "familia": "Pá carregadeira", "area": "Fundição"}, {"local": "80902205", "tag": "SH-91224", "descricao": "PA CARREGADEIRA 621D", "familia": "Pá carregadeira", "area": "Fundição"}, {"local": "80920550", "tag": "CE-91147", "descricao": "CARRO ELETRICO", "familia": "Carro elétrico", "area": "Offline"}, {"local": "80920551", "tag": "CE-91148", "descricao": "CARRO ELETRICO", "familia": "Carro elétrico", "area": "Offline"}, {"local": "80905441", "tag": "CE-91134", "descricao": "CARRO ELETRICO", "familia": "Carro elétrico", "area": "Cadinho"}, {"local": "80905016", "tag": "CE-93733", "descricao": "CARRETA TRANSPORTE DE CADINHO", "familia": "Carretinha", "area": "Cadinho"}, {"local": "80905017", "tag": "CE-93734", "descricao": "CARRETA TRANSPORTE DE CADINHO", "familia": "Carretinha", "area": "Cadinho"}, {"local": "80905018", "tag": "CE-93735", "descricao": "CARRETA TRANSPORTE DE CADINHO", "familia": "Carretinha", "area": "Cadinho"}, {"local": "80905019", "tag": "CE-93736", "descricao": "CARRETA TRANSPORTE DE CADINHO", "familia": "Carretinha", "area": "Cadinho"}, {"local": "80905020", "tag": "CE-93737", "descricao": "CARRETA TRANSPORTE DE CADINHO", "familia": "Carretinha", "area": "Cadinho"}, {"local": "80905021", "tag": "CE-93738", "descricao": "CARRETA TRANSPORTE DE CADINHO", "familia": "Carretinha", "area": "Cadinho"}, {"local": "80921797", "tag": "CE-93739", "descricao": "CARRETA TRANSPORTE DE CCB", "familia": "Carretinha", "area": "Cadinho"}, {"local": "91048456", "tag": "CE-93740", "descricao": "CARRETA TRANSPORTE DE CCM 4,5", "familia": "Carretinha", "area": "Cadinho"}, {"local": "91048457", "tag": "CE-93741", "descricao": "CARRETA TRANSPORTE DE CCM 4,5", "familia": "Carretinha", "area": "Cadinho"}, {"local": "80913114", "tag": "CE-91146", "descricao": "CARRO ELETRICO", "familia": "Carro elétrico", "area": "Manutenção Redução"}, {"local": "80920620", "tag": "CE-91123", "descricao": "CARRO ELETRICO", "familia": "Carro elétrico", "area": "Manutenção Redução"}, {"local": "80915377", "tag": "EP-91526", "descricao": "EMPILHADEIRA CLARK C55SD 5,5T", "familia": "Empilhadeira", "area": "Cadinho"}, {"local": "80913092", "tag": "CE-91113", "descricao": "CARRO ELETRICO", "familia": "Carro elétrico", "area": "Offline"}, {"local": "80917019", "tag": "CE-91115", "descricao": "CARRO ELETRICO", "familia": "Carro elétrico", "area": "Offline"}, {"local": "80935451", "tag": "CK-92334", "descricao": "CAVALO MECANICO VOLVO 520", "familia": "Cavalo mecânico", "area": "Offline"}, {"local": "91048453", "tag": "CK-92335", "descricao": "CAVALO MEC CONSTELLATION 19.330", "familia": "Cavalo mecânico", "area": "Offline"}, {"local": "80913138", "tag": "EP-91314", "descricao": "EMPILHADEIRA CLARK C45SD", "familia": "Empilhadeira", "area": "Offline"}, {"local": "80913130", "tag": "EP-91531", "descricao": "EMPILHADEIRA HYSTER H120FT", "familia": "Empilhadeira", "area": "OCH"}, {"local": "80900601", "tag": "CE-91112", "descricao": "CARRO ELETRICO", "familia": "Carro elétrico", "area": "Manutenção Preditiva"}, {"local": "80920648", "tag": "CE-91125", "descricao": "CARRO ELETRICO", "familia": "Carro elétrico", "area": "Manutenção Preditiva"}, {"local": "80913134", "tag": "CE-11601", "descricao": "Carreta comboio lubrificação", "familia": "Carreta comboio", "area": "Manutenção Redução"}, {"local": "80913135", "tag": "CE-11602", "descricao": "Carreta comboio de manutenção", "familia": "Carreta comboio", "area": "Manutenção Redução"}, {"local": "80916359", "tag": "CE-13601", "descricao": "Carreta comboio lubrificação", "familia": "Carreta comboio", "area": "Manutenção Redução"}, {"local": "80916360", "tag": "CE-13602", "descricao": "Carreta comboio de manutenção", "familia": "Carreta comboio", "area": "Manutenção Redução"}, {"local": "80991540", "tag": "CE-13603", "descricao": "Nova Carreta Comboio Manut F1", "familia": "Carreta comboio", "area": "Manutenção Redução"}, {"local": "80913109", "tag": "TT-91483", "descricao": "TRATOR CAIXA MARCHA DE 2 VELO", "familia": "Trator de rodas", "area": "Manutenção Redução"}, {"local": "80916343", "tag": "TT-91481", "descricao": "TRATOR AGRALE", "familia": "Trator de rodas", "area": "Manutenção Redução"}, {"local": "80916348", "tag": "CE-91139", "descricao": "CARRO ELETRICO", "familia": "Carro elétrico", "area": "Manutenção Redução"}, {"local": "80917004", "tag": "CE-91109", "descricao": "CARRO ELETRICO", "familia": "Carro elétrico", "area": "Offline"}, {"local": "80916955", "tag": "CE-93525", "descricao": "REBOQUE PRANCHA SEST", "familia": "Carreta prancha", "area": "Offline"}, {"local": "80916652", "tag": "CE-93527", "descricao": "REBOQUE PRANCHA NICOLAS", "familia": "Carreta prancha", "area": "Offline"}, {"local": "80916810", "tag": "CE-93528", "descricao": "CARRETA TRT - OFFLINE", "familia": "Veículos especiais", "area": "Offline"}, {"local": "80920548", "tag": "CE-93532", "descricao": "Carreta prancha Trudel", "familia": "Carreta prancha", "area": "Offline"}, {"local": "80920549", "tag": "CE-93533", "descricao": "Carreta prancha Trudel", "familia": "Carreta prancha", "area": "Offline"}, {"local": "80917009", "tag": "CK-92124", "descricao": "CAMINHAO CARROC. FORD CARG", "familia": "Caminhão carroceria", "area": "Offline"}, {"local": "91048470", "tag": "EP-91548", "descricao": "EMPILHADEIRA TOYOTA FSV 4.3T", "familia": "Empilhadeira", "area": "OCH"}, {"local": "80904456", "tag": "EP-91517", "descricao": "EMPILHADEIRA HYSTER S155XL2", "familia": "Empilhadeira", "area": "OCH"}, {"local": "80905468", "tag": "EP-91529", "descricao": "EMPILHADEIRA HYSTER H155FT 7T", "familia": "Empilhadeira", "area": "OCH"}, {"local": "80913129", "tag": "EP-91530", "descricao": "EMPILHADEIRA HYSTER H120FT", "familia": "Empilhadeira", "area": "OCH"}, {"local": "80905474", "tag": "EP-91541", "descricao": "EMPILHADEIRA HYSTER H120FT", "familia": "Empilhadeira", "area": "OCH"}, {"local": "80904451", "tag": "CE-91133", "descricao": "CARRO ELETRICO", "familia": "Carro elétrico", "area": "OCH"}, {"local": "80905467", "tag": "EP-91528", "descricao": "EMPILHADEIRA HYSTER H155FT", "familia": "Empilhadeira", "area": "OCH"}, {"local": "80913131", "tag": "EP-91533", "descricao": "EMPILHADEIRA HYSTER H120FT", "familia": "Empilhadeira", "area": "OCH"}, {"local": "80916357", "tag": "EP-91536", "descricao": "EMPILHADEIRA HYSTER H120FT", "familia": "Empilhadeira", "area": "OCH"}, {"local": "91048454", "tag": "EP-91546", "descricao": "EMPILHADEIRA HYSTER H5.5FT", "familia": "Empilhadeira", "area": "OCH"}, {"local": "91048455", "tag": "EP-91547", "descricao": "EMPILHADEIRA HYSTER H5.5FT", "familia": "Empilhadeira", "area": "OCH"}, {"local": "80920520", "tag": "EP-91560", "descricao": "EMPILHADEIRA TOYOTA FSV (7T)", "familia": "Empilhadeira", "area": "OCH"}, {"local": "80905418", "tag": "CE-93301", "descricao": "CARRETA REBOQUE METAL TRAILER", "familia": "Carreta reboque metal", "area": "Logística"}, {"local": "80905419", "tag": "CE-93302", "descricao": "CARRETA REBOQUE METAL TRAILER", "familia": "Carreta reboque metal", "area": "Logística"}, {"local": "80905420", "tag": "CE-93303", "descricao": "CARRETA REBOQUE METAL TRAILER", "familia": "Carreta reboque metal", "area": "Logística"}, {"local": "80905421", "tag": "CE-93304", "descricao": "CARRETA REBOQUE METAL TRAILER", "familia": "Carreta reboque metal", "area": "Logística"}, {"local": "80920588", "tag": "CE-93305", "descricao": "CARRETA REBOQUE METAL TRAILER", "familia": "Carreta reboque metal", "area": "Logística"}, {"local": "80920589", "tag": "CE-93306", "descricao": "CARRETA REBOQUE METAL TRAILER", "familia": "Carreta reboque metal", "area": "Logística"}, {"local": "80905422", "tag": "CE-93307", "descricao": "CARRETA REBOQUE METAL TRAILER", "familia": "Carreta reboque metal", "area": "Logística"}, {"local": "91048590", "tag": "CE-93308", "descricao": "CARRETA REBOQUE METAL TRAILER", "familia": "Carreta reboque metal", "area": "Logística"}, {"local": "80905453", "tag": "CM-31208", "descricao": "TRATOR TERMINAL MAFI MT32", "familia": "Trator terminal", "area": "Logística"}, {"local": "80905454", "tag": "CM-31209", "descricao": "TRATOR TERMINAL MAFI MT32", "familia": "Trator terminal", "area": "Logística"}, {"local": "80905457", "tag": "CM-31210", "descricao": "TRATOR TERMINAL MAFI MT32", "familia": "Trator terminal", "area": "Logística"}, {"local": "80905475", "tag": "CM-31211", "descricao": "TRATOR TERMINAL MAFI T230", "familia": "Trator terminal", "area": "Logística"}, {"local": "80905476", "tag": "CM-31212", "descricao": "TRATOR TERMINAL MAFI T230", "familia": "Trator terminal", "area": "Logística"}, {"local": "80905477", "tag": "CM-31213", "descricao": "TRATOR TERMINAL MAFI T230", "familia": "Trator terminal", "area": "Logística"}, {"local": "80905479", "tag": "CM-31214", "descricao": "TRATOR TERMINAL MAFI T230", "familia": "Trator terminal", "area": "Logística"}, {"local": "80905480", "tag": "CM-31215", "descricao": "TRATOR TERMINAL MAFI T230", "familia": "Trator terminal", "area": "Logística"}, {"local": "91048465", "tag": "CM-31216", "descricao": "TRATOR TERMINAL MAFI T230", "familia": "Trator terminal", "area": "Logística"}, {"local": "91048466", "tag": "CM-31217", "descricao": "TRATOR TERMINAL MAFI T230", "familia": "Trator terminal", "area": "Logística"}, {"local": "80920631", "tag": "EP-91285", "descricao": "EMPILHADEIRA HYSTER H60XM 3T", "familia": "Empilhadeira", "area": "Logística"}, {"local": "80905469", "tag": "EP-91310", "descricao": "EMPILHADEIRA HYSTER H60FT 4T", "familia": "Empilhadeira", "area": "Fundição"}, {"local": "80913132", "tag": "EP-91312", "descricao": "EMPILHADEIRA HYSTER H90FT 4T", "familia": "Empilhadeira", "area": "Fundição"}, {"local": "80935257", "tag": "EP-91509", "descricao": "EMPILHADEIRA HYSTER S155XL2", "familia": "Empilhadeira", "area": "Fundição"}, {"local": "80904460", "tag": "EP-91513", "descricao": "EMPILHADEIRA HYSTER S155XL2", "familia": "Empilhadeira", "area": "Fundição"}, {"local": "80935454", "tag": "EP-91516", "descricao": "EMPILHADEIRA YALE S155XL2 7T", "familia": "Empilhadeira", "area": "Fundição"}, {"local": "80916351", "tag": "TT-91497", "descricao": "TRATOR DE RODAS", "familia": "Trator de rodas", "area": "Cadinho"}, {"local": "80905440", "tag": "VC-91629", "descricao": "VARREDEIRA ELETRICA 120DL", "familia": "Varredeira", "area": "Fundição"}, {"local": "80920640", "tag": "CE-91126", "descricao": "CARRO ELETRICO", "familia": "Carro elétrico", "area": "Infraestrutura"}, {"local": "80920639", "tag": "CE-91124", "descricao": "CARRO ELETRICO", "familia": "Carro elétrico", "area": "Oficina de Veículos"}, {"local": "80913095", "tag": "CE-91130", "descricao": "CARRO ELETRICO", "familia": "Carro elétrico", "area": "Oficina de Veículos"}, {"local": "80920621", "tag": "CK-92117", "descricao": "CAMINHAO CARROCERIA", "familia": "Caminhão carroceria", "area": "Oficina de Veículos"}, {"local": "80903052", "tag": "CE-91117", "descricao": "CARRO ELETRICO", "familia": "Carro elétrico", "area": "Oficinas de Hastes"}, {"local": "80905425", "tag": "CE-93408", "descricao": "SILO REBOCÁVEL - ALUMINA", "familia": "Carreta silo", "area": "Logística"}, {"local": "80905426", "tag": "CE-93409", "descricao": "SILO REBOCÁVEL - ALUMINA", "familia": "Carreta silo", "area": "Logística"}, {"local": "80905427", "tag": "CE-93410", "descricao": "SILO REBOCÁVEL - ALUMINA", "familia": "Carreta silo", "area": "Logística"}, {"local": "80905428", "tag": "CE-93411", "descricao": "SILO REBOCÁVEL - ALUMINA", "familia": "Carreta silo", "area": "Logística"}, {"local": "80905482", "tag": "CE-93416", "descricao": "SILO REBOCÁVEL - ALUMINA", "familia": "Carreta silo", "area": "Logística"}, {"local": "91048560", "tag": "CE-93417", "descricao": "SILO REBOCÁVEL - ALUMINA", "familia": "Carreta silo", "area": "Logística"}, {"local": "80905429", "tag": "CE-93412", "descricao": "SILO REBOCÁVEL - BLEND", "familia": "Carreta silo", "area": "Logística"}, {"local": "80905430", "tag": "CE-93413", "descricao": "SILO REBOCÁVEL - BLEND", "familia": "Carreta silo", "area": "Logística"}, {"local": "80905431", "tag": "CE-93414", "descricao": "SILO REBOCÁVEL - ALUMINA", "familia": "Carreta silo", "area": "Logística"}, {"local": "80905481", "tag": "CE-93415", "descricao": "SILO REBOCÁVEL - BLEND", "familia": "Carreta silo", "area": "Logística"}, {"local": "80920590", "tag": "CE-93521", "descricao": "REBOQUE PRANCHA DE ANODO", "familia": "Carreta prancha", "area": "Logística"}, {"local": "80935453", "tag": "CE-93524", "descricao": "REBOQUE PRANCHA DE ANODO", "familia": "Carreta prancha", "area": "Logística"}, {"local": "91048468", "tag": "CE-93529", "descricao": "REBOQUE PRANCHA DE ANODO", "familia": "Carreta prancha", "area": "Logística"}, {"local": "91048469", "tag": "CE-93530", "descricao": "REBOQUE PRANCHA DE ANODO", "familia": "Carreta prancha", "area": "Logística"}, {"local": "80920515", "tag": "VC-91642", "descricao": "VARREDEIRA MECANICA DE SUCÇÃO", "familia": "Varredeira", "area": "Redução 3"}, {"local": "91048600", "tag": "TT-91500", "descricao": "Trator de rodas John Deere", "familia": "Trator de rodas", "area": "Redução 3"}, {"local": "91048602", "tag": "TT-91502", "descricao": "Trator de rodas John Deere", "familia": "Trator de rodas", "area": "Redução 4"}, {"local": "80913159", "tag": "CA-11101", "descricao": "VEÍCULO ALIMENTADOR DE ALUMINA", "familia": "Veículos especiais", "area": "Redução 1"}, {"local": "80916446", "tag": "VC-91643", "descricao": "VARREDEIRA HENCON", "familia": "Varredeira", "area": "Redução 3"}, {"local": "80920516", "tag": "CA-11102", "descricao": "VEÍCULO ALIMENTADOR DE ALUMINA", "familia": "Veículos especiais", "area": "Redução 1"}, {"local": "80905484", "tag": "EP-91316", "descricao": "EMPILHADEIRA HYSTER H60XT 3T", "familia": "Empilhadeira", "area": "OCH"}, {"local": "80915133", "tag": "CE-93721", "descricao": "CARRETA P/ TRANSPORTE DE DLVA", "familia": "Carretinha", "area": "Redução 1"}, {"local": "80911934", "tag": "CE-93728", "descricao": "CARRETA P/ TRANSPORTE DE DLVA", "familia": "Carretinha", "area": "Redução 2"}, {"local": "80911935", "tag": "CE-93730", "descricao": "CARRETA P/ TRANSPORTE DE DLVA", "familia": "Carretinha", "area": "Redução 3"}, {"local": "80913122", "tag": "CE-93732", "descricao": "CARRETA P/ TRANSPORTE DE DLVA", "familia": "Carretinha", "area": "Redução 4"}, {"local": "80913127", "tag": "TT-91496", "descricao": "TRATOR DE RODAS", "familia": "Trator de rodas", "area": "Redução 1"}, {"local": "89920700", "tag": "TT-91498", "descricao": "TRATOR DE RODAS", "familia": "Trator de rodas", "area": "Redução 2"}, {"local": "91048601", "tag": "TT-91501", "descricao": "Trator de rodas John Deere", "familia": "Trator de rodas", "area": "Salão Operação Redução 1"}, {"local": "80913096", "tag": "CE-91136", "descricao": "CARRO ELETRICO", "familia": "Carro elétrico", "area": "Redução 2"}, {"local": "80913097", "tag": "CE-91137", "descricao": "CARRO ELETRICO", "familia": "Carro elétrico", "area": "Redução 2"}, {"local": "80911932", "tag": "CE-93722", "descricao": "CARRETA P/ TRANSPORTE DE DLVA", "familia": "Carretinha", "area": "Redução 1"}, {"local": "80915134", "tag": "CE-93723", "descricao": "CARRETA P/ TRANSPORTE DE DLVA", "familia": "Carretinha", "area": "Redução 2"}, {"local": "80915135", "tag": "CE-93724", "descricao": "CARRETA P/ TRANSPORTE DE DLVA", "familia": "Carretinha", "area": "Redução 3"}, {"local": "80913845", "tag": "CE-93725", "descricao": "CARRETA P/ TRANSPORTE DE DLVA", "familia": "Carretinha", "area": "Redução 4"}, {"local": "80913120", "tag": "CE-93729", "descricao": "CARRETA P/ TRANSPORTE DE DLVA", "familia": "Carretinha", "area": "Redução 1"}, {"local": "80910811", "tag": "TT-91486", "descricao": "TRATOR CAIXA MARCHA DE 2 VELO", "familia": "Trator de rodas", "area": "Redução 2"}, {"local": "80902215", "tag": "VC-91639", "descricao": "VARREDEIRA MECANICA 800D", "familia": "Varredeira", "area": "Redução 3"}, {"local": "80913846", "tag": "CE-93726", "descricao": "CARRETA P/ TRANSPORTE DE DLVA", "familia": "Carretinha", "area": "Redução 3"}, {"local": "80913859", "tag": "CK-92121", "descricao": "CAMINHAO SUGADOR FORD DIESEL", "familia": "Caminhão sugador", "area": "Manutenção Redução"}, {"local": "80905439", "tag": "TT-91406", "descricao": "TRATOR COM TRANSMISSAO SINCRO", "familia": "Trator de rodas", "area": "Manutenção Redução"}, {"local": "80916340", "tag": "TT-91487", "descricao": "TRATOR CAIXA MARCHA DE 2 VELO", "familia": "Trator de rodas", "area": "Redução 4"}, {"local": "80914036", "tag": "TT-91491", "descricao": "TRATOR AGRALE", "familia": "Trator de rodas", "area": "Redução 4"}, {"local": "80905483", "tag": "EP-91315", "descricao": "EMPILHADEIRA HYSTER H60XT 3T", "familia": "Empilhadeira", "area": "FAV"}, {"local": "80903061", "tag": "EP-91543", "descricao": "EMPILHADEIRA HYSTER H120FT 5T", "familia": "Empilhadeira", "area": "FAV"}, {"local": "80905555", "tag": "CE-93531", "descricao": "REBOQUE PRANCHA DE ANODO", "familia": "Carreta prancha", "area": "Logística"}, {"local": "91048474", "tag": "CK-92336", "descricao": "CAVALO MEC MAGNA RIOS", "familia": "Cavalo mecânico", "area": "Logística"}, {"local": "91048475", "tag": "CK-92337", "descricao": "CAVALO MEC MAGNA RIOS", "familia": "Cavalo mecânico", "area": "Logística"}, {"local": "91048476", "tag": "CK-92338", "descricao": "CAVALO MEC MAGNA RIOS", "familia": "Cavalo mecânico", "area": "Logística"}, {"local": "91048471", "tag": "EP-91549", "descricao": "EMPILHADEIRA TOYOTA FSV 4.3T", "familia": "Empilhadeira", "area": "Logística"}, {"local": "91048472", "tag": "EP-91550", "descricao": "EMPILHADEIRA TOYOTA FSV 4.3T", "familia": "Empilhadeira", "area": "Logística"}, {"local": "91048473", "tag": "EP-91551", "descricao": "EMPILHADEIRA TOYOTA FSV 4.3T", "familia": "Empilhadeira", "area": "Logística"}, {"local": "80920517", "tag": "EP-91557", "descricao": "EMPILHADEIRA TOYOTA FSV (7T)", "familia": "Empilhadeira", "area": "Logística"}, {"local": "80920518", "tag": "EP-91558", "descricao": "EMPILHADEIRA TOYOTA FSV (7T)", "familia": "Empilhadeira", "area": "Logística"}, {"local": "80930633", "tag": "CE-91111", "descricao": "Carro Elétrico", "familia": "Carro elétrico", "area": "Utilidades"}, {"local": "91048467", "tag": "CK-92128", "descricao": "CAMINHÃO VARREDEIRA COLPION", "familia": "Caminhão varredeira", "area": "Manutenção OCH"}, {"local": "91079143", "tag": "CK-92129", "descricao": "CAMINHÃO VARREDEIRA COLPION", "familia": "Caminhão varredeira", "area": "Manutenção OCH"}, {"local": "89912188", "tag": "GE7220002", "descricao": "GERADOR DE EMERGENCIA 230KW", "familia": "Gerador de emergência", "area": "Subestação"}];
const BORRACHEIROS_PADRAO = [{"matricula": "27079", "nome": "João Carlos"}, {"matricula": "29380", "nome": "Ernani Durão"}, {"matricula": "27866", "nome": "José Francisco"}, {"matricula": "24940", "nome": "Williames Batista"}, {"matricula": "29640", "nome": "Gilvandro da Silva"}];
const SENHA_PADRAO_HASH = "11ede52bafce9ddae3c9e56b921d2631ed4d1beb8a0345c3e715f3d92d800590";

const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
let fs;
try { fs = initializeFirestore(fbApp, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }); }
catch (e) { fs = initializeFirestore(fbApp, {}); }

/* Adaptador: mesma interface que o app já usa */
const comPrazo = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej({ code: "timeout" }), ms))]);
const embrulhaDoc = (s) => ({ id: s.id, exists: s.exists(), data: () => s.data(), metadata: s.metadata });
const embrulhaQ = (s) => ({ docs: s.docs.map(embrulhaDoc), metadata: s.metadata });
function consulta(path, cons = []) {
  return {
    where: (f, op, v) => consulta(path, cons.concat(where(f, op, v))),
    orderBy: (f, dir) => consulta(path, cons.concat(orderBy(f, dir))),
    limit: (n) => consulta(path, cons.concat(limit(n))),
    get: () => comPrazo(getDocs(query(collection(fs, path), ...cons)), 8000).then(embrulhaQ),
    onSnapshot: (next, err) => onSnapshot(query(collection(fs, path), ...cons), { includeMetadataChanges: true }, (s) => next(embrulhaQ(s)), err),
    doc: (id) => documento(path + "/" + id)
  };
}
function documento(path) {
  return {
    set: (data) => comPrazo(setDoc(doc(fs, path), data), 15000),
    onSnapshot: (next, err) => onSnapshot(doc(fs, path), (s) => next(embrulhaDoc(s)), err)
  };
}
const bancoFirebase = { doc: documento, collection: (p) => consulta(p) };
function conectarFirebase(aoConectar, aoFalhar) {
  onAuthStateChanged(auth, (u) => { if (u) aoConectar(bancoFirebase); });
  auth.authStateReady().then(() => { if (!auth.currentUser) signInAnonymously(auth).catch(aoFalhar); }).catch(aoFalhar);
}

(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  /* ---------- armazenamento local (cache e fila offline) ---------- */
  const LS = {
    get(k, d) { try { const v = localStorage.getItem("borr." + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("borr." + k, JSON.stringify(v)); } catch (e) {} }
  };

  let db = null;
  let dbPronto = false;
  let equip = LS.get("equip", null) || EQUIP_PADRAO;
  let borracheiros = LS.get("borracheiros", null) || BORRACHEIROS_PADRAO;
  let senhaHash = LS.get("senhaHash", null) || SENHA_PADRAO_HASH;
  let fila = LS.get("fila", []);
  let ultimaSync = LS.get("ultimaSync", null);
  let registrosCtrl = [];
  let assinaturaCtrl = null;
  let usuario = null;
  let timerSalvo = null;

  /* ---------- utilidades ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  const hojeISO = (d = new Date()) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const horaHM = (d = new Date()) => pad(d.getHours()) + ":" + pad(d.getMinutes());
  const fmtData = (iso) => { if (!iso) return "—"; const [y, m, d] = iso.split("-"); return d + "/" + m + "/" + y; };
  const norm = (s) => String(s || "").toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Z0-9]/g, "");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const novoId = () => Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  async function sha256(txt) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(txt));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  /* ---------- navegação ---------- */
  const telas = ["inicio", "matricula", "registro", "salvo", "senha", "controle"];
  function ir(nome) {
    telas.forEach((t) => ($("#t-" + t).hidden = t !== nome));
    window.scrollTo(0, 0);
    if (nome !== "salvo" && timerSalvo) { clearInterval(timerSalvo); timerSalvo = null; }
  }
  $$("[data-voltar]").forEach((b) => b.addEventListener("click", () => ir(b.dataset.voltar)));

  /* ---------- barra de status ---------- */
  function atualizarStatus() {
    const online = navigator.onLine && !!db;
    const st = $("#status");
    st.classList.toggle("off", !online);
    $("#st-texto").textContent = online ? "Sistema online" : (dbPronto || !navigator.onLine ? "Sem conexão · salvando no tablet" : "Conectando…");
    let t = "Última sincronização: " + (ultimaSync ? horaHM(new Date(ultimaSync)) : "—");
    $("#st-sync").innerHTML = esc(t) + (fila.length ? ' · <span class="fila">' + fila.length + (fila.length === 1 ? " registro aguardando envio" : " registros aguardando envio") + "</span>" : "");
  }
  function relogio() {
    const d = new Date();
    $("#st-relogio").textContent = fmtData(hojeISO(d)) + " " + horaHM(d) + ":" + pad(d.getSeconds());
  }
  setInterval(relogio, 1000); relogio();
  window.addEventListener("online", () => { atualizarStatus(); enviarFila(); });
  window.addEventListener("offline", atualizarStatus);

  /* ---------- fila offline ---------- */
  let enviando = false;
  async function enviarFila() {
    if (enviando || !db || !navigator.onLine || !fila.length) { atualizarStatus(); return; }
    enviando = true;
    try {
      while (fila.length) {
        const item = fila[0];
        try {
          await db.collection("registros").doc(item.id).set(item.data);
        } catch (e) {
          if (e && (e.code === "invalid_argument" || e.code === "permission-denied")) { console.warn("Registro recusado", e); fila.shift(); LS.set("fila", fila); continue; }
          break;
        }
        fila.shift(); LS.set("fila", fila);
        ultimaSync = new Date().toISOString(); LS.set("ultimaSync", ultimaSync);
      }
    } finally { enviando = false; atualizarStatus(); renderCtrl(); }
  }
  setInterval(enviarFila, 30000);

  /* ---------- conexão com o banco ---------- */
  function marcarSync() { ultimaSync = new Date().toISOString(); LS.set("ultimaSync", ultimaSync); atualizarStatus(); }
  function iniciarAssinaturas() {
    db.doc("config/equipamentos").onSnapshot((s) => {
      if (s.exists && Array.isArray(s.data().lista)) { equip = s.data().lista; LS.set("equip", equip); buscarEquip(); renderCtrl(); }
      if (!s.metadata.fromCache) marcarSync();
    }, () => {});
    db.doc("config/borracheiros").onSnapshot((s) => {
      if (s.exists && Array.isArray(s.data().lista)) { borracheiros = s.data().lista; LS.set("borracheiros", borracheiros); verMatricula(); }
    }, () => {});
    db.doc("config/acesso").onSnapshot((s) => {
      if (s.exists && s.data().senhaHash) { senhaHash = s.data().senhaHash; LS.set("senhaHash", senhaHash); }
    }, () => {});
    enviarFila();
  }
  conectarFirebase((banco) => {
    if (db) return;
    db = banco; dbPronto = true; atualizarStatus(); iniciarAssinaturas();
  }, () => { dbPronto = true; atualizarStatus(); });

  /* ---------- início ---------- */
  $("#b-iniciar").addEventListener("click", () => { $("#i-matricula").value = ""; verMatricula(); ir("matricula"); });
  $("#b-controlador").addEventListener("click", () => { $("#i-senha").value = ""; $("#msg-senha").textContent = ""; ir("senha"); setTimeout(() => $("#i-senha").focus(), 50); });

  /* ---------- matrícula ---------- */
  function acharBorracheiro(m) { return borracheiros.find((b) => String(b.matricula) === String(m)); }
  function verMatricula() {
    const m = $("#i-matricula").value.replace(/\D/g, "");
    $("#i-matricula").value = m;
    const b = acharBorracheiro(m);
    const out = $("#nome-encontrado");
    out.classList.remove("erro");
    if (b) { out.textContent = b.nome; $("#b-confirmar-mat").disabled = false; }
    else {
      $("#b-confirmar-mat").disabled = true;
      if (m.length >= 5) { out.classList.add("erro"); out.textContent = borracheiros.length ? "Matrícula não encontrada. Confira o número." : "Lista de borracheiros ainda não carregada. Verifique a conexão."; }
      else out.textContent = "";
    }
  }
  $("#i-matricula").addEventListener("input", verMatricula);
  $("#teclado").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const i = $("#i-matricula");
    if (b.dataset.t === "limpar") i.value = "";
    else if (b.dataset.t === "apagar") i.value = i.value.slice(0, -1);
    else if (i.value.length < 8) i.value += b.textContent;
    verMatricula();
  });
  $("#b-confirmar-mat").addEventListener("click", () => {
    const b = acharBorracheiro($("#i-matricula").value); if (!b) return;
    usuario = { matricula: String(b.matricula), nome: b.nome };
    novoFormulario(); ir("registro");
  });

  /* ---------- formulário ---------- */
  let F = {};
  let historicoTag = [];
  function novoFormulario() {
    F = { equipamento: null, eixo: null, lado: null, posicao: null, destino: null, condicao: null, motivo: null, defeito: null, unidade: null };
    historicoTag = [];
    ["#i-tag", "#i-saiu-serie", "#i-saiu-tag", "#i-entrou-serie", "#i-entrou-tag", "#i-medida", "#i-outro", "#i-leitura", "#i-om", "#i-obs"].forEach((s) => ($(s).value = ""));
    $$(".opcoes button").forEach((b) => b.setAttribute("aria-pressed", "false"));
    $("#quem-reg").textContent = "Borracheiro: " + usuario.nome + " · " + usuario.matricula;
    $("#pendencias").innerHTML = "";
    $$(".cartao").forEach((c) => c.classList.remove("falta"));
    $("#sugestao").innerHTML = "";
    $("#resultados").innerHTML = "";
    mostrarEquip();
    atualizarMotivo();
    const d = new Date(); setDataHora("fim", d); setDataHora("ini", new Date(d.getTime() - 3600000));
    const med = LS.get("medidas", []);
    $("#medidas").innerHTML = med.map((m) => '<option value="' + esc(m) + '">').join("");
  }

  $$(".opcoes[data-campo]").forEach((g) => {
    g.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      const campo = g.dataset.campo;
      const ja = b.getAttribute("aria-pressed") === "true";
      if (ja && g.hasAttribute("data-opcional")) { F[campo] = null; b.setAttribute("aria-pressed", "false"); }
      else { g.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); F[campo] = b.dataset.v; }
      if (campo === "motivo" || campo === "defeito") atualizarMotivo();
      if (["eixo", "lado", "posicao"].includes(campo)) sugerirSaiu();
      const c = g.closest(".cartao"); if (c) c.classList.remove("falta");
    });
  });

  function atualizarMotivo() {
    $("#bloco-defeito").hidden = F.motivo !== "Pneu com defeito";
    if (F.motivo !== "Pneu com defeito") { F.defeito = null; $$('[data-campo="defeito"] button').forEach((b) => b.setAttribute("aria-pressed", "false")); }
    const precisaTexto = F.motivo === "Outro" || (F.motivo === "Pneu com defeito" && F.defeito === "Outro");
    $("#bloco-outro").hidden = !precisaTexto;
  }

  /* busca de equipamento */
  function buscarEquip() {
    if ($("#t-registro").hidden || F.equipamento) return;
    const q = norm($("#i-tag").value);
    const box = $("#resultados");
    if (!q) { box.innerHTML = equip.length ? "" : '<p class="dica">Lista de equipamentos ainda não carregada. Verifique a conexão.</p>'; return; }
    const achados = equip.filter((e) => norm(e.tag).includes(q) || norm(e.descricao).includes(q)).slice(0, 8);
    if (!achados.length) { box.innerHTML = '<p class="dica">Nenhum equipamento com "' + esc($("#i-tag").value) + '". Confira a TAG.</p>'; return; }
    const exato = achados.filter((e) => norm(e.tag).endsWith(q) && q.length >= 5);
    if (exato.length === 1 && achados.length === 1) { escolherEquip(exato[0]); return; }
    box.innerHTML = achados.map((e, i) => '<button data-i="' + equip.indexOf(e) + '"><b>' + esc(e.tag) + "</b><span>" + esc(e.descricao) + "</span><small>" + esc(e.familia) + " · " + esc(e.area) + "</small></button>").join("");
  }
  $("#i-tag").addEventListener("input", buscarEquip);
  $("#resultados").addEventListener("click", (e) => { const b = e.target.closest("button[data-i]"); if (b) escolherEquip(equip[+b.dataset.i]); });

  function escolherEquip(e) {
    F.equipamento = e; $("#c-equip").classList.remove("falta"); mostrarEquip(); carregarHistoricoTag(e.tag);
  }
  function mostrarEquip() {
    const e = F.equipamento;
    $("#equip-busca").hidden = !!e;
    $("#equip-escolhido").hidden = !e;
    if (!e) return;
    $("#equip-escolhido").innerHTML = '<div class="equip-sel"><span class="tag">' + esc(e.tag) + '</span><div class="desc"><strong>' + esc(e.descricao) + "</strong><small>" + esc(e.familia) + '</small></div><span class="chip">' + esc(e.area) + '</span><button class="icone-btn" id="b-trocar-equip">Trocar</button></div>';
    $("#b-trocar-equip").addEventListener("click", () => { F.equipamento = null; historicoTag = []; $("#sugestao").innerHTML = ""; $("#i-tag").value = ""; mostrarEquip(); buscarEquip(); $("#i-tag").focus(); });
  }

  async function carregarHistoricoTag(tag) {
    historicoTag = fila.map((f) => f.data).filter((r) => r.tag === tag);
    if (db && navigator.onLine) {
      try {
        const snap = await db.collection("registros").where("tag", "==", tag).get();
        const ids = new Set(fila.map((f) => f.id));
        historicoTag = historicoTag.concat(snap.docs.filter((d) => !ids.has(d.id)).map((d) => d.data()));
      } catch (e) {}
    }
    sugerirSaiu();
  }
  function sugerirSaiu() {
    const box = $("#sugestao");
    box.innerHTML = "";
    if (!F.equipamento || !F.eixo || !F.lado) return;
    const mesmo = historicoTag.filter((r) => r.posicao && String(r.posicao.eixo) === String(F.eixo) && r.posicao.lado === F.lado && (r.posicao.posicao || null) === (F.posicao || null))
      .sort((a, b) => String(b.dataHora).localeCompare(String(a.dataHora)));
    const u = mesmo[0];
    if (!u || !u.entrou || !u.entrou.serie) return;
    box.innerHTML = '<div class="sugestao"><span>Último pneu montado nesta posição: <b>série ' + esc(u.entrou.serie) + "</b>" + (u.entrou.tagPneu ? " (TAG " + esc(u.entrou.tagPneu) + ")" : "") + ", em " + esc(fmtData(u.dataServico)) + '.</span><button class="btn-amarelo" style="padding:0 18px" id="b-usar-sug">Usar no pneu que saiu</button></div>';
    $("#b-usar-sug").addEventListener("click", () => { $("#i-saiu-serie").value = u.entrou.serie; if (u.entrou.tagPneu) $("#i-saiu-tag").value = u.entrou.tagPneu; });
  }

  /* data e hora */
  function lerDataHora(q) {
    const dv = $("#i-data-" + q).value, hv = $("#i-hora-" + q).value;
    if (!dv || !hv) return null;
    const [y, m, d] = dv.split("-").map(Number); const [h, mi] = hv.split(":").map(Number);
    return new Date(y, m - 1, d, h, mi);
  }
  function fmtDur(min) { return Math.floor(min / 60) + "h " + (min % 60) + "m"; }
  function atualizarDuracao() {
    const a = lerDataHora("ini"), b = lerDataHora("fim"), box = $("#duracao");
    if (!a || !b) { box.textContent = "Duração: —"; return; }
    const min = Math.round((b - a) / 60000);
    box.textContent = min < 0 ? "A saída está antes da entrada" : "Duração: " + fmtDur(min);
    box.style.borderColor = min < 0 ? "var(--erro)" : ""; box.style.color = min < 0 ? "var(--erro)" : ""; box.style.background = min < 0 ? "var(--erro-bg)" : "";
  }
  function setDataHora(q, d) { $("#i-data-" + q).value = hojeISO(d); $("#i-hora-" + q).value = horaHM(d); atualizarDuracao(); }
  $$("[data-agora]").forEach((b) => b.addEventListener("click", () => setDataHora(b.dataset.agora, new Date())));
  $$("[data-menos1]").forEach((b) => b.addEventListener("click", () => {
    const q = b.dataset.menos1; const atual = lerDataHora(q) || new Date();
    setDataHora(q, new Date(atual.getTime() - 3600000));
  }));
  ["#i-data-ini", "#i-hora-ini", "#i-data-fim", "#i-hora-fim"].forEach((s) => $(s).addEventListener("input", atualizarDuracao));

  /* validação e salvamento */
  function validar() {
    const faltas = [];
    const add = (cartao, txt) => faltas.push({ cartao, txt });
    if (!F.equipamento) add("#c-equip", "Escolha o equipamento (TAG)");
    if (!F.eixo) add("#c-posicao", "Escolha o eixo");
    if (!F.lado) add("#c-posicao", "Escolha o lado (direito ou esquerdo)");
    if (!$("#i-saiu-serie").value.trim()) add("#c-pneus", "Nº de série do pneu que saiu");
    if (!F.destino) add("#c-pneus", "Destino do pneu que saiu");
    if (!$("#i-entrou-serie").value.trim()) add("#c-pneus", "Nº de série do pneu que entrou");
    if (!$("#i-medida").value.trim()) add("#c-pneus", "Tipo (medida) do pneu que entrou");
    if (!F.condicao) add("#c-pneus", "Condição do pneu que entrou (novo ou recapado)");
    if ($("#i-saiu-serie").value.trim() && norm($("#i-saiu-serie").value) === norm($("#i-entrou-serie").value)) add("#c-pneus", "O pneu que saiu e o que entrou estão com o mesmo nº de série");
    if (!F.motivo) add("#c-motivo", "Escolha o motivo da troca");
    if (F.motivo === "Pneu com defeito" && !F.defeito) add("#c-motivo", "Escolha qual defeito");
    if (!$("#bloco-outro").hidden && !$("#i-outro").value.trim()) add("#c-motivo", "Descreva o motivo em “Outro”");
    const leitura = $("#i-leitura").value.trim();
    if (leitura && !F.unidade) add("#c-sap", "Marque se a leitura é KM ou horas");
    if (leitura && isNaN(Number(leitura.replace(/\./g, "").replace(",", ".")))) add("#c-sap", "A leitura deve ser só número");
    const ini = lerDataHora("ini"), fim = lerDataHora("fim");
    if (!ini) add("#c-hora", "Informe data e hora de entrada");
    if (!fim) add("#c-hora", "Informe data e hora de saída");
    if (ini && fim && fim < ini) add("#c-hora", "A hora de saída está antes da hora de entrada");
    if (fim && fim.getTime() > Date.now() + 10 * 60000) add("#c-hora", "A hora de saída não pode estar no futuro");
    return faltas;
  }

  $("#b-salvar").addEventListener("click", () => {
    $$(".cartao").forEach((c) => c.classList.remove("falta"));
    const faltas = validar();
    if (faltas.length) {
      faltas.forEach((f) => $(f.cartao).classList.add("falta"));
      $("#pendencias").innerHTML = '<div class="pendencias">Falta preencher:<ul>' + faltas.map((f) => "<li>" + esc(f.txt) + "</li>").join("") + "</ul></div>";
      $(faltas[0].cartao).scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    $("#pendencias").innerHTML = "";
    const e = F.equipamento;
    const ini = lerDataHora("ini"), fim = lerDataHora("fim");
    const leituraTxt = $("#i-leitura").value.trim();
    const medida = $("#i-medida").value.trim().toUpperCase();
    const reg = {
      tag: e.tag,
      dataHora: ini.toISOString(),
      dataServico: $("#i-data-ini").value,
      horaServico: $("#i-hora-ini").value,
      inicio: { data: $("#i-data-ini").value, hora: $("#i-hora-ini").value },
      fim: { data: $("#i-data-fim").value, hora: $("#i-hora-fim").value },
      duracaoMin: Math.round((fim - ini) / 60000),
      criadoEm: new Date().toISOString(),
      borracheiro: { matricula: usuario.matricula, nome: usuario.nome },
      equipamento: { tag: e.tag, descricao: e.descricao, familia: e.familia, area: e.area, local: e.local || "" },
      posicao: { eixo: Number(F.eixo), lado: F.lado, posicao: F.posicao || null },
      saiu: { serie: $("#i-saiu-serie").value.trim().toUpperCase(), tagPneu: $("#i-saiu-tag").value.trim().toUpperCase(), destino: F.destino },
      entrou: { serie: $("#i-entrou-serie").value.trim().toUpperCase(), tagPneu: $("#i-entrou-tag").value.trim().toUpperCase(), medida, condicao: F.condicao },
      motivo: F.motivo,
      defeito: F.defeito || null,
      motivoTexto: $("#bloco-outro").hidden ? "" : $("#i-outro").value.trim(),
      leitura: leituraTxt ? { unidade: F.unidade, valor: Number(leituraTxt.replace(/\./g, "").replace(",", ".")) } : null,
      om: $("#i-om").value.trim(),
      observacoes: $("#i-obs").value.trim()
    };
    const med = LS.get("medidas", []);
    if (!med.includes(medida)) { med.unshift(medida); LS.set("medidas", med.slice(0, 30)); }
    fila.push({ id: novoId(), data: reg }); LS.set("fila", fila);
    atualizarStatus(); enviarFila(); renderCtrl();
    mostrarSalvo(reg);
  });

  function mostrarSalvo(r) {
    $("#salvo-texto").textContent = r.equipamento.tag + " · eixo " + r.posicao.eixo + " " + r.posicao.lado.toLowerCase() + (r.posicao.posicao ? " " + r.posicao.posicao.toLowerCase() : "") + " · saiu " + r.saiu.serie + ", entrou " + r.entrou.serie + "." + (navigator.onLine && db ? "" : " Sem conexão agora: o registro fica guardado no tablet e é enviado sozinho quando a internet voltar.");
    ir("salvo");
    let s = 30;
    $("#salvo-contagem").textContent = "Voltando para o início em " + s + " s";
    timerSalvo = setInterval(() => { s--; if (s <= 0) { usuario = null; ir("inicio"); } else $("#salvo-contagem").textContent = "Voltando para o início em " + s + " s"; }, 1000);
  }
  $("#b-outro-reg").addEventListener("click", () => { novoFormulario(); ir("registro"); });
  $("#b-sair-salvo").addEventListener("click", () => { usuario = null; ir("inicio"); });
  $("#b-cancelar-reg").addEventListener("click", () => {
    const b = $("#b-cancelar-reg");
    if (b.dataset.confirma === "1") { b.dataset.confirma = ""; b.textContent = ""; b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M15 5l-7 7 7 7"/></svg>'; usuario = null; ir("inicio"); return; }
    b.dataset.confirma = "1"; b.textContent = "Sair sem salvar?";
    setTimeout(() => { if (b.dataset.confirma === "1") { b.dataset.confirma = ""; b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M15 5l-7 7 7 7"/></svg>'; } }, 4000);
  });

  /* ---------- controlador ---------- */
  $("#f-senha").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $("#msg-senha");
    if (!senhaHash) { msg.textContent = "Senha ainda não carregada. Verifique a conexão e tente de novo."; return; }
    const h = await sha256($("#i-senha").value);
    if (h !== senhaHash) { msg.textContent = "Senha incorreta."; $("#i-senha").select(); return; }
    $("#i-senha").value = ""; msg.textContent = "";
    abrirControle();
  });

  let inscritoCtrl = false;
  let tagAberta = null;
  function abrirControle() {
    ir("controle");
    $("#ctrl-lista").hidden = false; $("#ctrl-detalhe").hidden = true; tagAberta = null;
    if (db && !inscritoCtrl) {
      inscritoCtrl = true;
      db.collection("registros").orderBy("dataHora", "desc").limit(1000).onSnapshot((snap) => {
        registrosCtrl = snap.docs.map((d) => Object.assign({ _id: d.id, _pendente: !!(d.metadata && d.metadata.hasPendingWrites) }, d.data()));
        if (!snap.metadata.fromCache) marcarSync();
        renderCtrl();
      }, () => { inscritoCtrl = false; });
    }
    renderCtrl();
  }
  function todosRegistros() {
    const ids = new Set(registrosCtrl.map((r) => r._id));
    const pend = fila.filter((f) => !ids.has(f.id)).map((f) => Object.assign({ _id: f.id, _pendente: true }, f.data));
    return pend.concat(registrosCtrl).sort((a, b) => String(b.dataHora).localeCompare(String(a.dataHora)));
  }
  function renderCtrl() {
    if ($("#t-controle").hidden) return;
    if (tagAberta) { renderDetalhe(tagAberta); return; }
    const regs = todosRegistros();
    const grupos = new Map();
    regs.forEach((r) => { if (!grupos.has(r.tag)) grupos.set(r.tag, []); grupos.get(r.tag).push(r); });
    const q = norm($("#i-busca-ctrl").value);
    const itens = Array.from(grupos.entries()).map(([tag, rs]) => {
      const e = equip.find((x) => x.tag === tag) || rs[0].equipamento || { tag };
      return { tag, e, rs };
    }).filter((it) => !q || norm(it.tag).includes(q) || norm(it.e.descricao).includes(q) || norm(it.e.area).includes(q) || norm(it.e.familia).includes(q));
    $("#resumo-ctrl").textContent = regs.length ? regs.length + (regs.length === 1 ? " troca registrada" : " trocas registradas") + " em " + grupos.size + (grupos.size === 1 ? " equipamento" : " equipamentos") + (q ? " · mostrando " + itens.length : "") : "";
    const box = $("#lista-equip");
    if (!regs.length) {
      box.innerHTML = '<div class="vazio">' + (db ? "Nenhuma troca registrada ainda.<br>Cada troca salva no tablet aparece aqui, agrupada pela TAG do equipamento." : "Sem conexão com o banco de dados. Os registros aparecem aqui quando a conexão voltar.") + "</div>";
      return;
    }
    if (!itens.length) { box.innerHTML = '<div class="vazio">Nenhum equipamento encontrado para essa busca.</div>'; return; }
    box.innerHTML = itens.map((it) => {
      const u = it.rs[0];
      return '<button data-tag="' + esc(it.tag) + '"><span class="tag">' + esc(it.tag) + '</span><span class="meio"><strong>' + esc(it.e.descricao || "") + "</strong><small>" + esc([it.e.familia, it.e.area].filter(Boolean).join(" · ")) + '</small></span><span class="dir"><b>' + it.rs.length + "</b><small>" + (it.rs.length === 1 ? "troca" : "trocas") + " · última " + esc(fmtData(u.dataServico)) + "</small></span></button>";
    }).join("");
  }
  $("#i-busca-ctrl").addEventListener("input", renderCtrl);
  $("#lista-equip").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-tag]"); if (!b) return;
    tagAberta = b.dataset.tag; $("#ctrl-lista").hidden = true; $("#ctrl-detalhe").hidden = false; renderDetalhe(tagAberta); window.scrollTo(0, 0);
  });
  $("#b-voltar-lista").addEventListener("click", () => { tagAberta = null; $("#ctrl-lista").hidden = false; $("#ctrl-detalhe").hidden = true; renderCtrl(); });

  function renderDetalhe(tag) {
    const rs = todosRegistros().filter((r) => r.tag === tag);
    const e = equip.find((x) => x.tag === tag) || (rs[0] && rs[0].equipamento) || { tag };
    const cab = '<div class="cab-equip"><span class="tag">' + esc(tag) + '</span><span class="desc">' + esc(e.descricao || "") + '</span><div class="chips">' +
      [e.familia, e.area, e.local ? "Local " + e.local : ""].filter(Boolean).map((c) => '<span class="chip">' + esc(c) + "</span>").join("") +
      '<span class="chip">' + rs.length + (rs.length === 1 ? " troca" : " trocas") + "</span></div></div>";
    const cards = rs.map((r) => {
      const p = r.posicao || {};
      const motivo = r.motivo === "Pneu com defeito" ? "Pneu com defeito: " + (r.defeito === "Outro" ? r.motivoTexto : r.defeito) : (r.motivo === "Outro" ? "Outro: " + r.motivoTexto : r.motivo);
      const cond = r.entrou.condicao === "Novo" ? '<span class="selo novo">Novo</span>' : '<span class="selo recap">Recapado</span>';
      const det = [
        r.leitura ? "<span><b>" + (r.leitura.unidade === "H" ? "Horímetro" : "KM") + "</b>" + esc(Number(r.leitura.valor).toLocaleString("pt-BR")) + (r.leitura.unidade === "H" ? " h" : " km") + "</span>" : "",
        r.om ? "<span><b>OM</b>" + esc(r.om) + "</span>" : "",
        r.observacoes ? "<span><b>Obs.</b>" + esc(r.observacoes) + "</span>" : ""
      ].join("");
      let quando = esc(fmtData(r.dataServico)) + " · " + esc(r.horaServico);
      if (r.fim && r.fim.hora) {
        quando += " → " + (r.fim.data !== r.dataServico ? esc(fmtData(r.fim.data)) + " " : "") + esc(r.fim.hora);
        if (typeof r.duracaoMin === "number") quando += ' <small style="font-family:var(--f-corpo);font-size:16px;color:var(--muted)">(' + fmtDur(r.duracaoMin) + ")</small>";
      }
      return '<article class="registro"><div class="topo-reg"><span class="quando">' + quando + "</span>" +
        '<span class="por">' + esc(r.borracheiro.nome) + " · " + esc(r.borracheiro.matricula) + (r._pendente ? ' <span class="selo pend">Aguardando envio</span>' : "") + "</span></div>" +
        '<div class="pos"><span class="chip">Eixo ' + esc(p.eixo) + '</span><span class="chip">' + esc(p.lado) + "</span>" + (p.posicao ? '<span class="chip">' + esc(p.posicao) + "</span>" : "") + '<span class="chip">' + esc(motivo) + "</span></div>" +
        '<div class="par"><section class="saiu"><h4>Saiu</h4><dl class="kv"><dt>Série</dt><dd>' + esc(r.saiu.serie) + "</dd>" + (r.saiu.tagPneu ? "<dt>TAG</dt><dd>" + esc(r.saiu.tagPneu) + "</dd>" : "") + "<dt>Destino</dt><dd>" + esc(r.saiu.destino) + "</dd></dl></section>" +
        '<section class="entrou"><h4>Entrou ' + cond + '</h4><dl class="kv"><dt>Série</dt><dd>' + esc(r.entrou.serie) + "</dd>" + (r.entrou.tagPneu ? "<dt>TAG</dt><dd>" + esc(r.entrou.tagPneu) + "</dd>" : "") + "<dt>Medida</dt><dd>" + esc(r.entrou.medida) + "</dd></dl></section></div>" +
        (det ? '<div class="detalhes">' + det + "</div>" : "") + "</article>";
    }).join("");
    $("#detalhe-conteudo").innerHTML = cab + (cards || '<div class="vazio">Nenhuma troca registrada neste equipamento.</div>');
  }

  $("#b-sair-ctrl").addEventListener("click", () => { tagAberta = null; ir("inicio"); });

  /* trocar senha */
  $("#b-trocar-senha").addEventListener("click", () => { ["#i-senha-atual", "#i-senha-nova", "#i-senha-conf"].forEach((s) => ($(s).value = "")); $("#msg-trocar").textContent = ""; $("#modal-senha").hidden = false; $("#i-senha-atual").focus(); });
  $("#b-fechar-modal").addEventListener("click", () => ($("#modal-senha").hidden = true));
  $("#f-trocar").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $("#msg-trocar"); msg.className = "msg erro";
    if ((await sha256($("#i-senha-atual").value)) !== senhaHash) { msg.textContent = "A senha atual está errada."; return; }
    const n = $("#i-senha-nova").value;
    if (n.length < 6) { msg.textContent = "A nova senha precisa ter pelo menos 6 caracteres."; return; }
    if (n !== $("#i-senha-conf").value) { msg.textContent = "As duas senhas novas não são iguais."; return; }
    if (!db || !navigator.onLine) { msg.textContent = "Sem conexão. A senha só pode ser trocada com internet."; return; }
    try {
      const h = await sha256(n);
      await db.doc("config/acesso").set({ senhaHash: h, alteradaEm: new Date().toISOString() });
      senhaHash = h; LS.set("senhaHash", h);
      msg.className = "msg ok"; msg.textContent = "Senha trocada.";
      setTimeout(() => ($("#modal-senha").hidden = true), 1200);
    } catch (err) { msg.textContent = "Não foi possível salvar a senha. Tente de novo."; }
  });

  atualizarStatus();
})();
