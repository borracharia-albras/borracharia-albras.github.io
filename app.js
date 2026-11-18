import { initializeApp, getAuth, signInAnonymously, onAuthStateChanged, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, setDoc, onSnapshot, collection, query, where, orderBy, limit, getDocs, runTransaction } from "./firebase.js";

const firebaseConfig = {
  apiKey: "AIzaSyBGWkju71fECEfizymK9dU0v_Wi6IAV0lU",
  authDomain: "borracharia-albras.firebaseapp.com",
  projectId: "borracharia-albras",
  storageBucket: "borracharia-albras.firebasestorage.app",
  messagingSenderId: "519309613823",
  appId: "1:519309613823:web:d445b38f76ae64d94bcaca"
};

/* Legenda de tipos de pneu (marcação = nº do pneu 000–999 + código do tipo) */
const TIPOS = [{"codigo": "295", "medida": "295.80 - 22,5 Borrachudo"}, {"codigo": "296", "medida": "295.80 - 22,5 Direcional"}, {"codigo": "275", "medida": "275.80 - 22,5"}, {"codigo": "122", "medida": "1100.R - 22"}, {"codigo": "120", "medida": "1100R.20"}, {"codigo": "716", "medida": "7.50 - 16"}, {"codigo": "715", "medida": "7.50 - 15"}, {"codigo": "830", "medida": "18.4 - 30"}, {"codigo": "834", "medida": "18.4 - 34"}, {"codigo": "235", "medida": "235/75 - 17,5"}, {"codigo": "205", "medida": "20.5 - 25"}, {"codigo": "124", "medida": "12.4 - 24"}, {"codigo": "508", "medida": "5.00-8 Pneumático"}, {"codigo": "580", "medida": "5.00-8 Maciço"}, {"codigo": "186", "medida": "18.6.12 1/8 Maciço"}, {"codigo": "289", "medida": "28.9-15 Maciço"}, {"codigo": "650", "medida": "6.50-10 Maciço"}, {"codigo": "250", "medida": "250-15 Maciço"}, {"codigo": "300", "medida": "300-15 Maciço"}, {"codigo": "355", "medida": "355/50-20 Maciço"}, {"codigo": "351", "medida": "355.50-15 Maciço"}, {"codigo": "365", "medida": "355/65-15 Maciço"}, {"codigo": "700", "medida": "7.00-12 Maciço"}, {"codigo": "825", "medida": "8.25-15 Maciço"}, {"codigo": "228", "medida": "22.8-16 Maciço"}];
const TIPOS_MAP = Object.fromEntries(TIPOS.map((t) => [t.codigo, t]));
const EH_MACICO = (cod) => !!(cod && TIPOS_MAP[cod] && /maci/i.test(TIPOS_MAP[cod].medida));
/* nº máximo de eixos por família de equipamento (ajustável) */
const MAX_EIXOS = { "Carreta prancha": 16, "Veículos especiais": 8, "Carreta silo": 4, "Carreta reboque metal": 4, "Carreta comboio": 4,
  "Cavalo mecânico": 3, "Caminhão bombeiro": 3, "Caminhão carroceria": 3, "Caminhão sugador": 3, "Caminhão varredeira": 3, "Trator terminal": 3,
  "Carretinha": 2, "Empilhadeira": 2, "Carro elétrico": 2, "Trator de rodas": 2, "Pá carregadeira": 2, "Varredeira": 2, "Gerador de emergência": 2 };
const SERIE_SUSPEITA = (s) => { const t = String(s || "").replace(/\s/g, ""); return t.length > 0 && (t.length < 4 || /^(.)\1+$/.test(t) || /^0+1?$/.test(t)); };

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
    set: (data, opts) => comPrazo(setDoc(doc(fs, path), data, opts || {}), 15000),
    onSnapshot: (next, err) => onSnapshot(doc(fs, path), (s) => next(embrulhaDoc(s)), err)
  };
}
const bancoFirebase = {
  doc: documento,
  collection: (p) => consulta(p),
  /* reserva "qtd" números de TAG de uma vez, sem nunca repetir entre aparelhos */
  reservarTags: (qtd, codigo) => comPrazo(runTransaction(fs, async (t) => {
    const ref = doc(fs, "contadores", String(codigo));
    const s = await t.get(ref);
    const ultimo = s.exists() ? Number(s.data().ultimo) || 0 : 0;
    t.set(ref, { ultimo: ultimo + qtd, atualizadoEm: new Date().toISOString() });
    return ultimo;
  }), 12000)
};
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
  let pneusMap = LS.get("pneus", {});
  let reservaTags = LS.get("reservaTipos", {});
  if (Array.isArray(reservaTags)) reservaTags = {};
  let proximaTela = "registro";

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

  /* ---------- TAG e pneus ---------- */
  /* marcação: "001 275" = pneu nº 001 do tipo 275. Igual ao livro de controle: cada tipo vai de 000 a 999, nessa ordem. */
  function fmtTag(n, codigo) {
    if (n > 1000) throw new Error("esgotado");
    return String(n - 1).padStart(3, "0") + " " + codigo;
  }
  function normTag(v) {
    const d = String(v || "").replace(/\D/g, "");
    return d.length === 6 ? d.slice(0, 3) + " " + d.slice(3) : "";
  }
  const tipoDe = (tag) => (tag ? TIPOS_MAP[String(tag).slice(4)] || null : null);
  const nomeTipo = (cod) => (TIPOS_MAP[cod] ? cod + " · " + TIPOS_MAP[cod].medida : cod);
  function pneuPorTag(tag) {
    if (!tag) return null;
    let p = pneusMap[tag] ? Object.assign({}, pneusMap[tag]) : null;
    fila.forEach((f) => { if (f.col === "pneus" && f.id === tag) p = Object.assign(p || {}, f.data); });
    return p;
  }
  function todosPneus() {
    const m = {};
    Object.keys(pneusMap).forEach((t) => (m[t] = Object.assign({}, pneusMap[t])));
    fila.forEach((f) => { if (f.col === "pneus") m[f.id] = Object.assign(m[f.id] || {}, f.data); });
    return Object.values(m);
  }
  function pneuPorSerie(serie) {
    const s = norm(serie); if (!s) return null;
    return todosPneus().find((p) => norm(p.serie) === s) || null;
  }
  const NOME_STATUS = { estoque: "Estoque (novo)", patio: "Pátio (usado)", montado: "Montado", recapagem: "Na recapagem", conserto: "No conserto", sucata: "Sucata" };
  /* pneu que só foi cadastrado (marcado agora) e ainda não teve nenhum lançamento */
  const soCadastro = (pn) => !!pn && (pn.status === "patio" || pn.status === "estoque") &&
    (pn.eventos || []).every((e) => e.tipo === "cadastro" || /^Cadastrado/.test(String(e.texto || "")));
  function textoStatus(pn) {
    if (!pn) return "";
    if (pn.status === "montado" && pn.local) return "Montado em " + pn.local.equipTag + " · eixo " + pn.local.eixo + " " + String(pn.local.lado || "").toLowerCase() + (pn.local.posicao ? " " + pn.local.posicao.toLowerCase() : "");
    return NOME_STATUS[pn.status] || "Situação desconhecida";
  }
  const textoRecap = (n) => (n === null || n === undefined || n === "" ? "" : Number(n) === 0 ? "0 recapagem" : Number(n) + "ª recapagem");
  async function garantirReserva(min, codigo) {
    const lista = reservaTags[codigo] || [];
    if (lista.length >= min || !db || !navigator.onLine) return;
    const ultimo = await db.reservarTags(1, codigo);
    if (ultimo + 1 <= 1000) lista.push(ultimo + 1);
    lista.sort((a, b) => a - b);
    reservaTags[codigo] = lista; LS.set("reservaTipos", reservaTags);
  }
  async function gerarTag(codigo) {
    if (!TIPOS_MAP[codigo]) throw new Error("tipo");
    let erro = null;
    if (!(reservaTags[codigo] || []).length) { try { await garantirReserva(1, codigo); } catch (e) { erro = e; } }
    const lista = reservaTags[codigo] || [];
    if (!lista.length) {
      const cod = (erro && erro.code) || (!navigator.onLine ? "offline" : !db ? "sem-banco" : "desconhecido");
      const er = new Error("sem-reserva"); er.code = cod; throw er;
    }
    lista.sort((a, b) => a - b);
    const n = lista.shift(); reservaTags[codigo] = lista; LS.set("reservaTipos", reservaTags);
    return fmtTag(n, codigo);
  }
  function msgErroTag(er, cod) {
    if (er && er.message === "esgotado") return "Os 1.000 números do tipo " + cod + " já foram usados.";
    const c = er && er.code;
    if (c === "permission-denied") return "O Firebase recusou gerar a marcação (sem permissão). As regras novas do Firestore precisam ser publicadas.";
    if (c === "offline" || c === "timeout" || c === "unavailable") return "Sem internet para gerar a marcação agora. Conecte o tablet e tente de novo.";
    if (c === "sem-banco") return "O app ainda está conectando ao banco. Espere alguns segundos e tente de novo.";
    return "Não foi possível gerar a marcação agora (" + (c || "erro") + "). Tente de novo em alguns segundos.";
  }
  function evento(texto, extra) {
    return Object.assign({ data: new Date().toISOString(), texto, por: usuario ? usuario.nome : "" }, extra || {});
  }
  const fotoAntes = (pn) => (pn ? { status: pn.status || null, local: pn.local || null, recapagens: pn.recapagens ?? null } : null);
  function comEvento(pn, ev) { return ((pn && pn.eventos) || []).concat([ev]).slice(-60); }
  function filaPneu(tag, data) { fila.push({ col: "pneus", id: tag, data, merge: true }); }

  /* ---------- navegação ---------- */
  const telas = ["inicio", "matricula", "registro", "salvo", "senha", "controle", "pneus", "tag"];
  function ir(nome) {
    if (nome === "inicio" && window.__appAtualizado) { location.reload(); return; }
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
          await db.collection(item.col || "registros").doc(item.id).set(item.data, item.merge ? { merge: true } : undefined);
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
    db.collection("pneus").onSnapshot((snap) => {
      const m = {}; snap.docs.forEach((d) => (m[d.id] = d.data()));
      pneusMap = m; LS.set("pneus", m);
      renderCtrl();
    }, () => {});
    enviarFila();
  }
  conectarFirebase((banco) => {
    if (db) return;
    db = banco; dbPronto = true; atualizarStatus(); iniciarAssinaturas();
  }, () => { dbPronto = true; atualizarStatus(); });

  /* ---------- início ---------- */
  $("#b-iniciar").addEventListener("click", () => { proximaTela = "registro"; $("#i-matricula").value = ""; verMatricula(); ir("matricula"); });
  $("#b-pneus").addEventListener("click", () => { proximaTela = "pneus"; $("#i-matricula").value = ""; verMatricula(); ir("matricula"); });
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
    if (proximaTela === "pneus") { abrirPneus(); return; }
    novoFormulario(); ir("registro");
  });

  /* ---------- formulário ---------- */
  let F = {};
  let pneus = [];
  let historicoTag = [];
  const novoPneu = (ant) => ({ servico: "troca", medidaTipo: ant ? ant.medidaTipo : null,
    eixo: null, lado: null, posicao: null, saiuSerie: "", saiuTag: "", saiuTagNova: null, saiuTagAplicada: null, saiuCondicao: null, saiuRecapagens: null, destino: null,
    entrouTagNova: null, entrouTagAplicada: null,
    entrouSerie: "", entrouTag: "", medida: ant ? ant.medida : "", condicao: null, recapagens: null,
    motivo: null, defeito: null, outro: "" });

  function novoFormulario() {
    F = { equipamento: null, unidade: null, juntar: null, naoJuntar: false, avisosOk: false };
    $("#om-junta").innerHTML = ""; $("#om-outro").innerHTML = ""; F.omOutro = null; $("#i-leitura").disabled = false;
    pneus = [novoPneu()];
    historicoTag = [];
    ["#i-tag", "#i-leitura", "#i-om", "#i-obs"].forEach((s) => ($(s).value = ""));
    $$(".opcoes[data-campo] button").forEach((b) => b.setAttribute("aria-pressed", "false"));
    $("#quem-reg").textContent = "Borracheiro: " + usuario.nome + " · " + usuario.matricula;
    $("#pendencias").innerHTML = "";
    $$(".cartao").forEach((c) => c.classList.remove("falta"));
    $("#resultados").innerHTML = "";
    mostrarEquip();
    const d = new Date(); setDataHora("fim", d); $("#i-data-ini").value = hojeISO(d); $("#i-hora-ini").value = ""; atualizarDuracao();
    const med = LS.get("medidas", []);
    $("#medidas").innerHTML = med.map((m) => '<option value="' + esc(m) + '">').join("");
    renderPneus();
  }

  /* grupos fixos (KM/H) */
  $$(".opcoes[data-campo]").forEach((g) => {
    g.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      const campo = g.dataset.campo;
      const ja = b.getAttribute("aria-pressed") === "true";
      if (ja && g.hasAttribute("data-opcional")) { F[campo] = null; b.setAttribute("aria-pressed", "false"); }
      else { g.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); F[campo] = b.dataset.v; }
      if (campo === "unidade") { const sem = F.unidade === "SEM"; $("#i-leitura").disabled = sem; if (sem) $("#i-leitura").value = ""; else $("#i-leitura").focus(); }
      F.avisosOk = false;
      const c = g.closest(".cartao"); if (c) c.classList.remove("falta");
    });
  });
  $("#i-om").addEventListener("input", () => { $("#c-chamado").classList.remove("falta"); F.naoJuntar = false; verificarOM(); });
  $("#t-registro").addEventListener("input", () => { F.avisosOk = false; });

  /* mesma OM no mesmo equipamento: junta no mesmo chamado */
  let omConsulta = 0;
  async function checarOMOutros(om) {
    F.omOutro = null;
    if (!F.equipamento || !/^\d{9}$/.test(om)) return;
    const meu = F.equipamento.tag, id = ++omConsulta;
    const achar = (lista) => lista.filter((r) => r && String(r.om || "").replace(/\D/g, "") === om && r.tag && r.tag !== meu)
      .sort((a, b) => String(b.dataHora).localeCompare(String(a.dataHora)))[0] || null;
    let outro = achar(fila.filter((f) => !f.col).map((f) => f.data).concat(registrosCtrl));
    if (!outro && db && navigator.onLine) {
      try { const snap = await db.collection("registros").where("om", "==", om).get(); outro = achar(snap.docs.map((d) => d.data())); } catch (e) {}
    }
    if (id !== omConsulta || !F.equipamento || F.equipamento.tag !== meu || $("#i-om").value.replace(/\D/g, "") !== om) return;
    F.omOutro = outro ? { tag: outro.tag, data: outro.dataServico, por: (outro.borracheiro && outro.borracheiro.nome) || "" } : null;
    const box = $("#om-outro");
    if (box) box.innerHTML = F.omOutro ? '<div class="tag-erro">A OM ' + esc(om) + " já foi usada no equipamento <b>" + esc(F.omOutro.tag) + "</b> (" + esc(fmtData(F.omOutro.data)) + (F.omOutro.por ? ", " + esc(F.omOutro.por) : "") + "). Uma OM é de um equipamento só: confira o número.</div>" : "";
  }
  function verificarOM() {
    const box = $("#om-junta"); F.juntar = null;
    const om = $("#i-om").value.replace(/\D/g, "");
    checarOMOutros(om);
    if (!F.equipamento || om.length < 9) { box.innerHTML = ""; return; }
    const iguais = historicoTag.filter((r) => String(r.om || "").replace(/\D/g, "") === om && r.tag === F.equipamento.tag && r.chamadoId)
      .sort((a, b) => String(b.dataHora).localeCompare(String(a.dataHora)));
    if (!iguais.length) { box.innerHTML = ""; return; }
    const u = iguais[0], doCham = iguais.filter((r) => r.chamadoId === u.chamadoId);
    const n = Math.max(...doCham.map((r) => Number(r.pneuNumero) || 1));
    const desc = plural(doCham.length, "pneu", "pneus") + ", " + fmtData(u.dataServico) + " às " + (u.horaServico || "?") + ", " + ((u.borracheiro && u.borracheiro.nome) || "");
    if (F.naoJuntar) {
      box.innerHTML = '<div class="tag-aviso">Essa OM já tem um chamado neste equipamento (' + esc(desc) + "). Este registro vai ficar separado.<button class=\"btn-sec\" data-junta=\"sim\">Juntar ao chamado</button></div>";
      return;
    }
    F.juntar = { chamadoId: u.chamadoId, n };
    box.innerHTML = '<div class="tag-ok">Essa OM já tem um chamado neste equipamento (' + esc(desc) + "). Os pneus deste registro vão entrar no mesmo chamado.<button class=\"btn-sec\" data-junta=\"nao\">Registrar separado</button></div>";
  }
  $("#om-junta").addEventListener("click", (e) => {
    const b = e.target.closest("[data-junta]"); if (!b) return;
    F.naoJuntar = b.dataset.junta === "nao"; verificarOM();
  });

  /* cartões de pneu */
  const OP = {
    eixo: Array.from({ length: 16 }, (_, k) => [String(k + 1), String(k + 1)]),
    lado: [["Direito", "Direito"], ["Esquerdo", "Esquerdo"]],
    posicao: [["Interno", "Interno"], ["Externo", "Externo"]],
    destino: [["Conserto", "Conserto"], ["Recapagem", "Recapagem"], ["Pátio", "Pátio"], ["Sucata", "Sucata"]],
    condicao: [["Novo", "Novo"], ["Recapado", "Recapado"]],
    saiuCondicao: [["Novo", "Novo"], ["Recapado", "Recapado"]],
    recapagens: [["0", "0 · Novo"], ["1", "1ª"], ["2", "2ª"], ["3", "3ª"], ["4", "4ª"], ["5", "5ª"], ["6", "6ª"], ["7", "7ª"], ["8", "8ª"], ["9", "9ª"], ["10", "10ª"]],
    saiuRecapagens: [["0", "0"], ["1", "1ª"], ["2", "2ª"], ["3", "3ª"], ["4", "4ª"], ["5", "5ª"], ["6", "6ª"], ["7", "7ª"], ["8", "8ª"], ["9", "9ª"], ["10", "10ª"]],
    motivo: [["Pneu furado", "Furado"], ["Pneu careca", "Careca"], ["Pneu com defeito", "Com defeito"], ["Pneu estourado", "Estourado"], ["Fim de vida", "Fim de vida (limite de recapagem)"], ["Roda/aro danificado", "Roda/aro danificado"], ["Outro", "Outro"]],
    defeito: [["Bolha", "Bolha"], ["Corte", "Corte"], ["Corte lateral", "Corte lateral"], ["Dano no talão", "Dano no talão"], ["Desgaste irregular", "Desgaste irregular"], ["Separação da banda", "Separação da banda"], ["Outro", "Outro"]],
    servico: [["troca", "Troca de pneu"], ["conserto", "Conserto no local (mesmo pneu volta)"]],
    motivoConserto: [["Pneu furado", "Furo"], ["Corte", "Corte"], ["Vazamento / válvula", "Vazamento / válvula"], ["Outro", "Outro"]]
  };
  function grupo(campo, valor, extra) {
    return '<div class="opcoes' + (campo === "eixo" ? " num eixos" : campo === "recapagens" || campo === "saiuRecapagens" ? " num" : "") + '" data-pcampo="' + campo + '"' + (extra || "") + ">" +
      (campo === "eixo" ? OP.eixo.slice(0, maxEixos()) : OP[campo]).map(([v, l]) => '<button data-v="' + esc(v) + '" aria-pressed="' + (String(valor) === v) + '">' + esc(l) + "</button>").join("") + "</div>";
  }
  function maxEixos() { const f = F.equipamento && String(F.equipamento.familia || "").trim(); return (f && MAX_EIXOS[f]) || 6; }
  const macicoSaiu = (p) => { const t = tipoDe(normTag(p.saiuTag)); return t ? EH_MACICO(t.codigo) : (p.servico !== "conserto" && EH_MACICO(p.medidaTipo)); };
  const macicoEntrou = (p) => { const t = tipoDe(normTag(p.entrouTag)); return t ? EH_MACICO(t.codigo) : EH_MACICO(p.medidaTipo); };
  function htmlMedida(p) {
    const sel = p.medidaTipo || "";
    return '<select class="campo" data-pinput="medidaSel" aria-label="Tipo de pneu (medida)"><option value="">Escolha o tipo…</option>' +
      TIPOS.map((t) => '<option value="' + t.codigo + '"' + (sel === t.codigo ? " selected" : "") + ">" + esc(t.codigo + " · " + t.medida) + "</option>").join("") +
      '<option value="outra"' + (sel === "outra" ? " selected" : "") + ">Outra medida (fora da legenda)</option></select>" +
      (sel === "outra" ? entrada("medida", p.medida, "Outra medida", ' placeholder="Escreva a medida" style="margin-top:8px"') : "");
  }
  function campoSerie(p, lado) {
    const sem = !!p[lado + "SemSerie"];
    return entrada(lado + "Serie", sem ? "" : p[lado + "Serie"], "Nº de série", sem ? ' disabled placeholder="Pneu sem nº de série"' : "") +
      '<button class="btn-semserie" data-acao="semserie" data-lado="' + lado + '" aria-pressed="' + sem + '">' + (sem ? "✓ Pneu sem nº de série" : "Pneu sem nº de série") + "</button>";
  }
  function entrada(campo, valor, rotulo, extra) {
    return '<input class="campo" data-pinput="' + campo + '" value="' + esc(valor) + '" autocomplete="off" aria-label="' + esc(rotulo) + '"' + (extra || "") + ">";
  }
  function textoPosicao(p) {
    if (!p.eixo && !p.lado) return "Escolha a posição";
    return [p.eixo ? "Eixo " + p.eixo : "", p.lado ? p.lado.toLowerCase() : "", p.posicao ? p.posicao.toLowerCase() : ""].filter(Boolean).join(" · ");
  }
  function sugestaoPara(p) {
    if (!F.equipamento || !p.eixo || !p.lado) return null;
    const mesmo = historicoTag.filter((r) => r.posicao && String(r.posicao.eixo) === String(p.eixo) && r.posicao.lado === p.lado && (r.posicao.posicao || null) === (p.posicao || null))
      .sort((a, b) => String(b.dataHora).localeCompare(String(a.dataHora)));
    const u = mesmo[0];
    return u && u.entrou && u.entrou.serie ? u : null;
  }
  function gerarBox(p, lado) {
    const sel = p[lado + "TipoSel"] || "";
    return '<div class="gerar-box"><select class="campo" data-pinput="' + lado + 'TipoSel" aria-label="Tipo do pneu para a TAG nova"><option value="">Pneu sem marcação? Escolha o tipo…</option>' +
      TIPOS.map((t) => '<option value="' + t.codigo + '"' + (sel === t.codigo ? " selected" : "") + ">" + esc(t.codigo + " · " + t.medida) + "</option>").join("") +
      '</select><button class="btn-gerar" data-acao="gerar" data-lado="' + lado + '">Gerar marcação nova</button></div>';
  }
  function htmlTagStatus(p, lado) {
    const dig = String(p[lado + "Tag"] || "").replace(/\D/g, "");
    const tag = normTag(dig);
    const gerar = gerarBox(p, lado);
    if (!tag) return (dig ? '<p class="tag-dica">Digite os 6 números: nº do pneu + código do tipo (ex.: 001 275).</p>' : "") + gerar;
    if (p[lado + "TagNova"] === tag) return '<div class="tag-nova"><span>Marcação nova · ' + esc(nomeTipo(tag.slice(4))) + "</span><b>" + esc(tag) + "</b><small>Marque no pneu: símbolo da Albras + estes números</small></div>";
    if (!tipoDe(tag)) {
      const inv = TIPOS_MAP[tag.slice(0, 3)];
      return '<div class="tag-erro">' + (inv ? "Parece que a ordem está invertida: primeiro o nº do pneu, depois o código do tipo (ex.: " + esc(tag.slice(4) + " " + tag.slice(0, 3)) + ")."
        : "O código de tipo " + esc(tag.slice(4)) + " não existe na legenda. Confira a marcação.") + "</div>" + gerar;
    }
    const pn = pneuPorTag(tag);
    if (!pn) return '<div class="tag-erro">O pneu ' + esc(tag) + " (" + esc(tipoDe(tag).medida) + ") não está cadastrado. Confira a marcação ou gere uma nova.</div>" + gerar;
    let aviso = "";
    if (lado === "entrou" && pn.status === "montado") aviso = "O sistema mostra este pneu já montado (" + textoStatus(pn) + "). Confira a TAG.";
    if (lado === "entrou" && pn.status === "recapagem") aviso = "Voltou da recapagem: marcado como " + (Math.min(10, (Number(pn.recapagens) || 0) + 1)) + "ª recapagem. Confira e corrija nos botões de recapagem se precisar.";
    if (lado === "entrou" && pn.status === "sucata") aviso = "O sistema mostra este pneu como sucata. Confira a TAG.";
    const novoMarcado = lado === "saiu" && soCadastro(pn);
    if (lado === "saiu" && pn.status !== "montado" && !novoMarcado) aviso = "O sistema mostra este pneu como “" + (NOME_STATUS[pn.status] || "?") + "”, não montado. Confira a TAG.";
    if (lado === "saiu" && pn.status === "montado" && pn.local && F.equipamento && pn.local.equipTag !== F.equipamento.tag) aviso = "O sistema mostra este pneu em outro equipamento (" + pn.local.equipTag + "). Confira a TAG.";
    return '<div class="tag-ok"><b>' + esc(tag) + "</b> · série " + esc(pn.serie || "—") + (pn.medida ? " · " + esc(pn.medida) : "") + (textoRecap(pn.recapagens) ? " · " + esc(textoRecap(pn.recapagens)) : "") +
      "<small>" + esc(novoMarcado ? "Marcado agora, ainda sem lançamento: vai ficar registrado como saindo deste equipamento" : textoStatus(pn)) + "</small></div>" + (aviso ? '<div class="tag-aviso">' + esc(aviso) + "</div>" : "");
  }
  function aplicarPneu(p, lado, tag) {
    const pn = pneuPorTag(tag); if (!pn) return false;
    if (p[lado + "TagAplicada"] === tag) return false;
    p[lado + "TagAplicada"] = tag;
    const rec = pn.recapagens === undefined || pn.recapagens === null ? null : String(pn.recapagens);
    if (lado === "saiu") {
      if (pn.serie) { p.saiuSerie = pn.serie; p.saiuSemSerie = false; } else if (pn.semSerie) { p.saiuSerie = ""; p.saiuSemSerie = true; }
      if (rec !== null) { p.saiuRecapagens = rec; p.saiuCondicao = rec === "0" ? "Sem recapagem" : "Recapado"; }
    } else {
      if (pn.serie) { p.entrouSerie = pn.serie; p.entrouSemSerie = false; } else if (pn.semSerie) { p.entrouSerie = ""; p.entrouSemSerie = true; }
      const tpE = tipoDe(tag);
      if (tpE) { p.medidaTipo = tpE.codigo; p.medida = tpE.medida; } else if (pn.medida) { p.medidaTipo = "outra"; p.medida = pn.medida; }
      let r2 = rec;
      if (pn.status === "recapagem") r2 = String(Math.min(10, (Number(pn.recapagens) || 0) + 1));
      if (r2 !== null) { p.recapagens = r2; p.condicao = r2 === "0" ? "Novo" : "Recapado"; }
    }
    return true;
  }
  function htmlPneu(p, i) {
    const conserto = p.servico === "conserto";
    const u = sugestaoPara(p);
    const sug = u && norm(p.saiuSerie) !== norm(u.entrou.serie)
      ? '<div class="sugestao"><span>Último pneu montado nesta posição: <b>série ' + esc(u.entrou.serie) + "</b>" + (u.entrou.tagPneu ? " (" + esc(u.entrou.tagPneu) + ")" : "") + ", em " + esc(fmtData(u.dataServico)) + '.</span><button class="btn-amarelo" style="padding:0 18px" data-acao="usar-sug" data-serie="' + esc(u.entrou.serie) + '" data-tag="' + esc(u.entrou.tagPneu || "") + '" data-cond="' + esc(u.entrou.condicao || "") + '" data-recap="' + esc(u.entrou.recapagens ?? "") + '">' + (conserto ? "Usar este pneu" : "Usar no pneu que saiu") + "</button></div>"
      : "";
    const precisaTexto = p.motivo === "Outro" || (!conserto && p.motivo === "Pneu com defeito" && p.defeito === "Outro");
    const recSaiu = macicoSaiu(p) ? '<p class="tag-dica">Pneu maciço: não tem recapagem.</p>'
      : '<span class="rotulo">Recapagens <span class="opc">(0 = nunca foi recapado)</span></span>' + grupo("saiuRecapagens", p.saiuRecapagens);
    const recEntrou = macicoEntrou(p) ? '<p class="tag-dica">Pneu maciço: não tem recapagem.</p>'
      : '<span class="rotulo">Recapagens <span class="opc">(0 = pneu novo)</span></span>' + grupo("recapagens", p.recapagens);
    const blocoSaiu = '<section class="saiu' + (conserto ? " conserto-sec" : "") + '"><h4><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6">' +
        (conserto ? '<path d="M5 12.5l4.5 4.5L19 7.5"/>' : '<path d="M12 5v14M5 12l7 7 7-7"/>') + "</svg>" + (conserto ? "Pneu consertado" : "Pneu que saiu") + "</h4>" +
        '<span class="rotulo">Marcação do pneu <span class="opc">(nº + tipo)</span></span>' + entrada("saiuTag", p.saiuTag, conserto ? "Marcação do pneu consertado" : "Marcação do pneu que saiu", ' placeholder="ex.: 001 275" inputmode="numeric"') +
        '<div class="tag-status" data-tagstatus="saiu">' + htmlTagStatus(p, "saiu") + "</div>" +
        '<span class="rotulo">Nº de série</span>' + campoSerie(p, "saiu") + recSaiu +
        (conserto ? "" : '<span class="rotulo">Destino</span>' + grupo("destino", p.destino)) + "</section>";
    const blocoEntrou = conserto ? "" : '<section class="entrou"><h4><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M12 19V5M5 12l7-7 7 7"/></svg>Pneu que entrou</h4>' +
        '<span class="rotulo">Marcação do pneu <span class="opc">(nº + tipo)</span></span>' + entrada("entrouTag", p.entrouTag, "Marcação do pneu que entrou", ' placeholder="ex.: 001 275" inputmode="numeric"') +
        '<div class="tag-status" data-tagstatus="entrou">' + htmlTagStatus(p, "entrou") + "</div>" +
        '<span class="rotulo">Nº de série</span>' + campoSerie(p, "entrou") +
        '<span class="rotulo">Tipo de pneu (medida)</span>' + htmlMedida(p) + recEntrou + "</section>";
    return '<article class="pneu" id="pneu-' + i + '" data-idx="' + i + '">' +
      '<header class="pneu-cab"><h4>Pneu ' + (i + 1) + "</h4>" + (conserto ? '<span class="servico-tag">Conserto no local</span>' : "") + '<span class="resumo-pos">' + esc(textoPosicao(p)) + "</span>" +
      (pneus.length > 1 ? '<button class="btn-remover" data-acao="remover">Remover</button>' : "") + "</header>" +
      '<span class="rotulo">Serviço</span>' + grupo("servico", p.servico) +
      '<span class="rotulo">Eixo</span>' + grupo("eixo", p.eixo) +
      '<span class="rotulo">Lado</span>' + grupo("lado", p.lado) +
      '<span class="rotulo">Posição <span class="opc">(deixe em branco se o eixo tem só um pneu de cada lado)</span></span>' + grupo("posicao", p.posicao, " data-opcional") +
      sug +
      (conserto ? '<div class="par-um">' + blocoSaiu + "</div>" : '<div class="par" style="margin-top:18px">' + blocoSaiu + blocoEntrou + "</div>") +
      '<div class="par-motivo"><span class="rotulo">' + (conserto ? "O que foi consertado" : "Motivo da troca") + "</span>" + grupo(conserto ? "motivoConserto" : "motivo", p.motivo) +
        (!conserto && p.motivo === "Pneu com defeito" ? '<span class="rotulo">Qual defeito?</span>' + grupo("defeito", p.defeito) : "") +
        (precisaTexto ? '<span class="rotulo">Descreva</span>' + entrada("outro", p.outro, "Descreva o motivo") : "") +
      "</div></article>";
  }
  function renderPneus() {
    $("#lista-pneus").innerHTML = pneus.map(htmlPneu).join("");
    $("#contador-pneus").textContent = pneus.length > 1 ? pneus.length + " pneus" : "";
  }
  function renderPneu(i) { const el = $("#pneu-" + i); if (el) el.outerHTML = htmlPneu(pneus[i], i); }

  $("#lista-pneus").addEventListener("click", (e) => {
    const card = e.target.closest(".pneu"); if (!card) return;
    const i = +card.dataset.idx, p = pneus[i];
    if (e.target.closest('[data-acao="remover"]')) { pneus.splice(i, 1); renderPneus(); return; }
    const ss = e.target.closest('[data-acao="semserie"]');
    if (ss) { const l = ss.dataset.lado; p[l + "SemSerie"] = !p[l + "SemSerie"]; if (p[l + "SemSerie"]) p[l + "Serie"] = ""; F.avisosOk = false; card.classList.remove("falta"); renderPneu(i); return; }
    const ger = e.target.closest('[data-acao="gerar"]');
    if (ger) {
      const lado = ger.dataset.lado, cod = p[lado + "TipoSel"];
      const box = card.querySelector('[data-tagstatus="' + lado + '"]');
      if (!cod) { if (box) box.innerHTML = '<div class="tag-erro">Escolha o tipo do pneu antes de gerar a marcação.</div>' + htmlTagStatus(p, lado); return; }
      ger.disabled = true; ger.textContent = "Gerando…";
      gerarTag(cod).then((t) => {
        p[lado + "Tag"] = t; p[lado + "TagNova"] = t; p[lado + "TagAplicada"] = t;
        if (lado === "entrou") { p.medida = TIPOS_MAP[cod].medida; p.medidaTipo = cod; }
        renderPneu(i);
      }).catch((er) => {
        if (box) box.innerHTML = '<div class="tag-erro">' + esc(msgErroTag(er, cod)) + "</div>" + htmlTagStatus(p, lado);
      });
      return;
    }
    const usar = e.target.closest('[data-acao="usar-sug"]');
    if (usar) {
      p.saiuSerie = usar.dataset.serie; if (usar.dataset.tag) { p.saiuTag = usar.dataset.tag; aplicarPneu(p, "saiu", normTag(usar.dataset.tag)); }
      if (usar.dataset.cond === "Novo") { p.saiuCondicao = "Sem recapagem"; p.saiuRecapagens = "0"; }
      else if (usar.dataset.cond === "Recapado" && usar.dataset.recap) { p.saiuCondicao = "Recapado"; p.saiuRecapagens = usar.dataset.recap; }
      else if (usar.dataset.cond === "Maciço") { p.saiuCondicao = "Maciço"; p.saiuRecapagens = null; }
      renderPneu(i); return;
    }
    const b = e.target.closest(".opcoes button"); if (!b) return;
    const g = b.closest("[data-pcampo]"), campo0 = g.dataset.pcampo, campo = campo0 === "motivoConserto" ? "motivo" : campo0;
    F.avisosOk = false;
    p[campo] = (String(p[campo]) === b.dataset.v && g.hasAttribute("data-opcional")) ? null : b.dataset.v;
    if (campo === "motivo" && p.motivo !== "Pneu com defeito") p.defeito = null;
    if (campo === "servico") {
      const lista = (p.servico === "conserto" ? OP.motivoConserto : OP.motivo).map((x) => x[0]);
      if (!lista.includes(p.motivo)) { p.motivo = null; p.defeito = null; }
    }
    const cond = (v) => (v === null || v === undefined ? null : String(v) === "0" ? "Novo" : "Recapado");
    if (campo === "recapagens") p.condicao = cond(p.recapagens);
    if (campo === "saiuRecapagens") p.saiuCondicao = p.saiuRecapagens === null ? null : String(p.saiuRecapagens) === "0" ? "Sem recapagem" : "Recapado";
    renderPneu(i);
  });
  $("#lista-pneus").addEventListener("input", (e) => {
    const inp = e.target.closest("[data-pinput]"); if (!inp) return;
    const card = inp.closest(".pneu"), i = +card.dataset.idx, p = pneus[i], campo = inp.dataset.pinput;
    p[campo] = inp.value;
    card.classList.remove("falta");
    if (campo === "medidaSel") {
      p.medidaTipo = inp.value || null;
      p.medida = inp.value && inp.value !== "outra" ? TIPOS_MAP[inp.value].medida : "";
      renderPneu(i); return;
    }
    if (campo === "saiuTag" || campo === "entrouTag") {
      const lado = campo === "saiuTag" ? "saiu" : "entrou";
      const tag = normTag(inp.value);
      if (aplicarPneu(p, lado, tag)) {
        renderPneu(i);
        const novo = $("#pneu-" + i + ' [data-pinput="' + campo + '"]');
        if (novo) { novo.focus(); const n = novo.value.length; try { novo.setSelectionRange(n, n); } catch (er) {} }
      } else {
        const box = card.querySelector('[data-tagstatus="' + lado + '"]'); if (box) box.innerHTML = htmlTagStatus(p, lado);
      }
    }
  });
  $("#b-add-pneu").addEventListener("click", () => {
    pneus.push(novoPneu(pneus[pneus.length - 1]));
    renderPneus();
    const el = $("#pneu-" + (pneus.length - 1)); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  });

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
    box.innerHTML = achados.map((e) => '<button data-i="' + equip.indexOf(e) + '"><b>' + esc(e.tag) + "</b><span>" + esc(e.descricao) + "</span><small>" + esc(e.familia) + " · " + esc(e.area) + "</small></button>").join("");
  }
  $("#i-tag").addEventListener("input", buscarEquip);
  $("#resultados").addEventListener("click", (e) => { const b = e.target.closest("button[data-i]"); if (b) escolherEquip(equip[+b.dataset.i]); });

  function escolherEquip(e) {
    F.equipamento = e; $("#c-equip").classList.remove("falta"); mostrarEquip(); carregarHistoricoTag(e.tag); verificarOM();
  }
  function mostrarEquip() {
    const e = F.equipamento;
    $("#equip-busca").hidden = !!e;
    $("#equip-escolhido").hidden = !e;
    if (!e) return;
    $("#equip-escolhido").innerHTML = '<div class="equip-sel"><span class="tag">' + esc(e.tag) + '</span><div class="desc"><strong>' + esc(e.descricao) + "</strong><small>" + esc(e.familia) + '</small></div><span class="chip">' + esc(e.area) + '</span><button class="icone-btn" id="b-trocar-equip">Trocar</button></div>';
    $("#b-trocar-equip").addEventListener("click", () => { F.equipamento = null; historicoTag = []; verificarOM(); renderPneus(); $("#i-tag").value = ""; mostrarEquip(); buscarEquip(); $("#i-tag").focus(); });
  }

  async function carregarHistoricoTag(tag) {
    historicoTag = fila.map((f) => f.data).filter((r) => r.tag === tag);
    renderPneus();
    if (db && navigator.onLine) {
      try {
        const snap = await db.collection("registros").where("tag", "==", tag).get();
        const ids = new Set(fila.map((f) => f.id));
        historicoTag = historicoTag.concat(snap.docs.filter((d) => !ids.has(d.id)).map((d) => d.data()));
      } catch (e) {}
    }
    if (F.equipamento && F.equipamento.tag === tag) { renderPneus(); verificarOM(); }
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
  const numLeitura = (t) => Number(t.replace(/\./g, "").replace(",", "."));
  function validar() {
    const faltas = [], avisos = [];
    const add = (alvo, txt) => faltas.push({ alvo, txt });
    const avisa = (alvo, txt) => avisos.push({ alvo, txt });
    if (!F.equipamento) add("#c-equip", "Escolha o equipamento (TAG)");
    const om = $("#i-om").value.trim();
    if (!om) add("#c-chamado", "Nº da OM / nota");
    else if (!/^\d{9}$/.test(om)) add("#c-chamado", "A OM deve ter 9 números, sem espaço nem letra (ex.: 110563177)");
    else if (F.omOutro) add("#c-chamado", "A OM " + om + " já foi usada no equipamento " + F.omOutro.tag + " (" + fmtData(F.omOutro.data) + "). Uma OM é de um equipamento só: confira o número");
    const leitura = $("#i-leitura").value.trim();
    if (!F.unidade) add("#c-chamado", "KM / horímetro: digite a leitura ou marque “Sem horímetro”");
    else if (F.unidade !== "SEM") {
      const v = numLeitura(leitura);
      if (!leitura) add("#c-chamado", "Digite a leitura do " + (F.unidade === "H" ? "horímetro" : "KM") + " (se não tiver, marque “Sem horímetro”)");
      else if (isNaN(v) || v <= 0) add("#c-chamado", "A leitura deve ser um número maior que zero (se não tiver, marque “Sem horímetro”)");
      else {
        const ant = historicoTag.filter((r) => r.leitura && r.leitura.unidade === F.unidade && Number(r.leitura.valor) > 0).sort((a, b) => String(b.dataHora).localeCompare(String(a.dataHora)))[0];
        if (ant && v < Number(ant.leitura.valor)) avisa("#c-chamado", "A leitura (" + v.toLocaleString("pt-BR") + ") é menor que a última deste equipamento (" + Number(ant.leitura.valor).toLocaleString("pt-BR") + " em " + fmtData(ant.dataServico) + ")");
      }
    }
    const posUsadas = {}, seriesEntrou = {}, tagsUsadas = {};
    pneus.forEach((p, k) => {
      const alvo = "#pneu-" + k, n = pneus.length > 1 ? "Pneu " + (k + 1) + ": " : "";
      const conserto = p.servico === "conserto";
      const nomeS = conserto ? "pneu consertado" : "pneu que saiu";
      if (!p.eixo) add(alvo, n + "escolha o eixo");
      else if (Number(p.eixo) > maxEixos()) add(alvo, n + "o eixo " + p.eixo + " não existe neste tipo de equipamento");
      if (!p.lado) add(alvo, n + "escolha o lado (direito ou esquerdo)");
      const ts = normTag(p.saiuTag), te = conserto ? "" : normTag(p.entrouTag);
      if (!ts) add(alvo, n + "marcação do " + nomeS + ": 6 números (se não tiver, gere uma nova)");
      else if (!tipoDe(ts)) add(alvo, n + "o código de tipo da marcação " + ts + " (" + nomeS + ") não existe");
      else if (!pneuPorTag(ts) && p.saiuTagNova !== ts) add(alvo, n + "o pneu " + ts + " (" + nomeS + ") não está cadastrado");
      if (!p.saiuSerie.trim() && !p.saiuSemSerie) add(alvo, n + "nº de série do " + nomeS + " (se o pneu não tem, toque em “Pneu sem nº de série”)");
      if (!macicoSaiu(p) && (p.saiuRecapagens === null || p.saiuRecapagens === undefined)) add(alvo, n + "recapagens do " + nomeS + " (0 se nunca foi recapado)");
      if (!conserto) {
        if (!te) add(alvo, n + "marcação do pneu que entrou: 6 números (se não tiver, gere uma nova)");
        else if (!tipoDe(te)) add(alvo, n + "o código de tipo da marcação " + te + " (pneu que entrou) não existe");
        else if (!pneuPorTag(te) && p.entrouTagNova !== te) add(alvo, n + "o pneu " + te + " (que entrou) não está cadastrado");
        if (ts && ts === te) add(alvo, n + "o pneu que saiu e o que entrou estão com a mesma marcação");
        if (!p.destino) add(alvo, n + "destino do pneu que saiu");
        if (!p.entrouSerie.trim() && !p.entrouSemSerie) add(alvo, n + "nº de série do pneu que entrou (se o pneu não tem, toque em “Pneu sem nº de série”)");
        if (!p.medidaTipo || (p.medidaTipo === "outra" && !String(p.medida || "").trim())) add(alvo, n + "tipo (medida) do pneu que entrou");
        if (!macicoEntrou(p) && (p.recapagens === null || p.recapagens === undefined)) add(alvo, n + "recapagens do pneu que entrou (0 se é novo)");
        const pnE = te && pneuPorTag(te);
        if (pnE && pnE.status === "montado" && pnE.local) {
          const ondeE = pnE.local.equipTag + " (eixo " + pnE.local.eixo + " " + String(pnE.local.lado || "").toLowerCase() + (pnE.local.posicao ? " " + String(pnE.local.posicao).toLowerCase() : "") + ")";
          if (F.equipamento && pnE.local.equipTag !== F.equipamento.tag) add(alvo, n + "o pneu " + te + " (que entrou) está montado em " + ondeE + ". Um pneu não pode estar em dois equipamentos: confira o número marcado no pneu. Se ele não tiver marcação, gere uma nova");
          else add(alvo, n + "o pneu " + te + " (que entrou) já está montado neste equipamento, em " + ondeE + ". Confira o número marcado no pneu. Se ele não tiver marcação, gere uma nova");
        }
        if (SERIE_SUSPEITA(p.entrouSerie)) avisa(alvo, n + "a série “" + p.entrouSerie.trim() + "” (pneu que entrou) parece incompleta. Se o pneu não tem série, toque em “Pneu sem nº de série”");
      }
      const pnS = ts && p.saiuTagNova !== ts && pneuPorTag(ts);
      if (pnS && F.equipamento && !soCadastro(pnS) && !(pnS.status === "montado" && pnS.local && pnS.local.equipTag === F.equipamento.tag))
        avisa(alvo, n + "pelo sistema, o pneu " + ts + " (" + nomeS + ") não está neste equipamento: " + (textoStatus(pnS) || "sem situação") + ". Confira o número marcado no pneu. Se ele não tiver marcação, gere uma nova");
      if (SERIE_SUSPEITA(p.saiuSerie)) avisa(alvo, n + "a série “" + p.saiuSerie.trim() + "” (" + nomeS + ") parece incompleta. Se o pneu não tem série, toque em “Pneu sem nº de série”");
      [ts, te].forEach((t) => { if (!t) return; if (tagsUsadas[t] !== undefined && tagsUsadas[t] !== k) add(alvo, n + "a marcação " + t + " já foi usada no pneu " + (tagsUsadas[t] + 1)); else tagsUsadas[t] = k; });
      if (!p.motivo) add(alvo, n + (conserto ? "o que foi consertado" : "motivo da troca"));
      if (!conserto && p.motivo === "Pneu com defeito" && !p.defeito) add(alvo, n + "qual defeito");
      if ((p.motivo === "Outro" || (!conserto && p.motivo === "Pneu com defeito" && p.defeito === "Outro")) && !p.outro.trim()) add(alvo, n + "descreva o motivo em “Outro”");
      if (p.eixo && p.lado) {
        const chave = p.eixo + "|" + p.lado + "|" + (p.posicao || "");
        if (posUsadas[chave] !== undefined) add(alvo, n + "mesma posição do pneu " + (posUsadas[chave] + 1));
        else posUsadas[chave] = k;
      }
    });
    const ini = lerDataHora("ini"), fim = lerDataHora("fim");
    if (!ini) add("#c-hora", "Digite a hora de entrada (quando o serviço começou)");
    if (!fim) add("#c-hora", "Informe data e hora de saída");
    if (ini && fim && fim < ini) add("#c-hora", "A hora de saída está antes da hora de entrada");
    if (fim && fim.getTime() > Date.now() + 10 * 60000) add("#c-hora", "A hora de saída não pode estar no futuro");
    if (ini && fim && fim >= ini) {
      const min = Math.round((fim - ini) / 60000);
      if (min < 5) avisa("#c-hora", "O serviço durou só " + min + " min. Confira as horas de entrada e saída");
      if (min > 8 * 60) avisa("#c-hora", "O serviço durou " + fmtDur(min) + ". Confira as horas de entrada e saída");
    }
    return { faltas, avisos };
  }

  $("#b-salvar").addEventListener("click", () => {
    $$(".cartao, .pneu").forEach((c) => c.classList.remove("falta"));
    const { faltas, avisos } = validar();
    if (faltas.length) {
      faltas.forEach((f) => { const el = $(f.alvo); if (el) el.classList.add("falta"); });
      $("#pendencias").innerHTML = '<div class="pendencias">Falta preencher:<ul>' + faltas.map((f) => "<li>" + esc(f.txt) + "</li>").join("") + "</ul></div>";
      const el = $(faltas[0].alvo); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (avisos.length && !F.avisosOk) {
      $("#pendencias").innerHTML = '<div class="pendencias avisos">Confira antes de salvar:<ul>' + avisos.map((f) => "<li>" + esc(f.txt) + "</li>").join("") +
        '</ul><button class="btn-sec" id="b-salvar-assim">Está certo, salvar assim</button></div>';
      $("#b-salvar-assim").addEventListener("click", () => { F.avisosOk = true; $("#b-salvar").click(); });
      $("#pendencias").scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    $("#pendencias").innerHTML = "";
    const e = F.equipamento;
    const ini = lerDataHora("ini"), fim = lerDataHora("fim");
    const leituraTxt = $("#i-leitura").value.trim();
    const agora = new Date().toISOString();
    const chamadoId = F.juntar ? F.juntar.chamadoId : novoId();
    const base = F.juntar ? F.juntar.n : 0;
    const comum = {
      tag: e.tag,
      chamadoId,
      totalPneus: base + pneus.length,
      dataHora: ini.toISOString(),
      dataServico: $("#i-data-ini").value,
      horaServico: $("#i-hora-ini").value,
      inicio: { data: $("#i-data-ini").value, hora: $("#i-hora-ini").value },
      fim: { data: $("#i-data-fim").value, hora: $("#i-hora-fim").value },
      duracaoMin: Math.round((fim - ini) / 60000),
      criadoEm: agora,
      borracheiro: { matricula: usuario.matricula, nome: usuario.nome },
      equipamento: { tag: e.tag, descricao: e.descricao, familia: e.familia, area: e.area, local: e.local || "" },
      leitura: F.unidade !== "SEM" && leituraTxt ? { unidade: F.unidade, valor: numLeitura(leituraTxt) } : null,
      semLeitura: F.unidade === "SEM",
      om: $("#i-om").value.trim(),
      observacoes: $("#i-obs").value.trim()
    };
    const med = LS.get("medidas", []);
    const regs = pneus.map((p, k) => {
      const conserto = p.servico === "conserto";
      const precisaTexto = p.motivo === "Outro" || (!conserto && p.motivo === "Pneu com defeito" && p.defeito === "Outro");
      const ts = normTag(p.saiuTag), te = normTag(p.entrouTag);
      const mS = macicoSaiu(p), mE = macicoEntrou(p);
      const saiu = { serie: p.saiuSemSerie ? "" : p.saiuSerie.trim().toUpperCase(), semSerie: !!p.saiuSemSerie, tagPneu: ts, tagNova: p.saiuTagNova === ts, destino: conserto ? "Conserto no local" : p.destino,
        condicao: mS ? "Maciço" : p.saiuCondicao, recapagens: mS ? null : Number(p.saiuRecapagens) };
      let entrou;
      if (conserto) {
        const tp = tipoDe(ts), pn = pneuPorTag(ts);
        entrou = { serie: saiu.serie, semSerie: saiu.semSerie, tagPneu: ts, tagNova: false, medida: (tp && tp.medida) || (pn && pn.medida) || "", tipo: tp ? tp.codigo : null,
          condicao: mS ? "Maciço" : (Number(p.saiuRecapagens) === 0 ? "Novo" : "Recapado"), recapagens: saiu.recapagens, mesmoPneu: true };
      } else {
        const medida = p.medidaTipo === "outra" ? String(p.medida || "").trim().toUpperCase() : TIPOS_MAP[p.medidaTipo].medida;
        if (!med.includes(medida)) med.unshift(medida);
        entrou = { serie: p.entrouSemSerie ? "" : p.entrouSerie.trim().toUpperCase(), semSerie: !!p.entrouSemSerie, tagPneu: te, tagNova: p.entrouTagNova === te, medida, tipo: p.medidaTipo !== "outra" ? p.medidaTipo : null,
          condicao: mE ? "Maciço" : p.condicao, recapagens: mE ? null : Number(p.recapagens) };
      }
      return Object.assign({}, comum, {
        pneuNumero: base + k + 1,
        servico: conserto ? "conserto" : "troca",
        posicao: { eixo: Number(p.eixo), lado: p.lado, posicao: p.posicao || null },
        saiu, entrou,
        motivo: p.motivo,
        defeito: conserto ? null : (p.defeito || null),
        motivoTexto: precisaTexto ? p.outro.trim() : ""
      });
    });
    LS.set("medidas", med.slice(0, 30));
    regs.forEach((r) => fila.push({ id: chamadoId + "-" + r.pneuNumero, data: r }));
    /* estoque: o pneu que saiu vai para o destino; o que entrou fica montado */
    const STATUS_DESTINO = { Conserto: "conserto", Recapagem: "recapagem", "Pátio": "patio", Estoque: "patio", Sucata: "sucata" };
    regs.forEach((r) => { Object.defineProperty(r, "_rid", { value: chamadoId + "-" + r.pneuNumero, enumerable: false }); });
    regs.forEach((r) => {
      const pos = "eixo " + r.posicao.eixo + " " + r.posicao.lado.toLowerCase() + (r.posicao.posicao ? " " + r.posicao.posicao.toLowerCase() : "");
      const local = { equipTag: r.tag, equipDesc: r.equipamento.descricao, eixo: r.posicao.eixo, lado: r.posicao.lado, posicao: r.posicao.posicao };
      const motivoTxt = r.motivo === "Outro" ? "Outro: " + r.motivoTexto : (r.defeito ? r.motivo + ": " + (r.defeito === "Outro" ? r.motivoTexto : r.defeito) : r.motivo);
      const velhoS = pneuPorTag(r.saiu.tagPneu);
      const tS = tipoDe(r.saiu.tagPneu);
      if (r.servico === "conserto") {
        const d = { tag: r.saiu.tagPneu, serie: r.saiu.serie || (velhoS && velhoS.serie) || "", semSerie: !!r.saiu.semSerie, recapagens: r.saiu.recapagens, status: "montado", local, atualizadoEm: agora,
          eventos: comEvento(velhoS, evento("Consertado no local em " + r.tag + " (" + pos + ") · " + motivoTxt, { om: r.om, tipo: "conserto", reg: r._rid, antes: fotoAntes(velhoS) })) };
        if (!velhoS) { d.criadoEm = agora; d.criadoPor = { matricula: usuario.matricula, nome: usuario.nome }; }
        if (tS) { d.tipo = tS.codigo; if (!velhoS || !velhoS.medida) d.medida = tS.medida; }
        filaPneu(r.saiu.tagPneu, d);
        return;
      }
      const dS = { tag: r.saiu.tagPneu, serie: r.saiu.serie || (velhoS && velhoS.serie) || "", semSerie: !!r.saiu.semSerie, recapagens: r.saiu.recapagens, status: STATUS_DESTINO[r.saiu.destino] || "patio", local: null, atualizadoEm: agora,
        eventos: comEvento(velhoS, evento("Saiu de " + r.tag + " (" + pos + ") → " + r.saiu.destino + " · " + motivoTxt,
          { om: r.om, tipo: r.saiu.destino === "Recapagem" ? "enviado_recapagem" : "saida", reg: r._rid, antes: fotoAntes(velhoS) })) };
      if (!velhoS) { dS.criadoEm = agora; dS.criadoPor = { matricula: usuario.matricula, nome: usuario.nome }; }
      if (tS) dS.tipo = tS.codigo;
      if (!velhoS || !velhoS.medida) dS.medida = tS ? tS.medida : r.entrou.medida;
      filaPneu(r.saiu.tagPneu, dS);
      const velhoE = pneuPorTag(r.entrou.tagPneu);
      const voltou = velhoE && velhoE.status === "recapagem";
      const txtE = (voltou ? "Voltou da recapagem (" + (velhoE.recapagens ?? "?") + " → " + (r.entrou.recapagens ?? "?") + ") e foi montado em " : "Montado em ") + r.tag + " (" + pos + ")";
      const dE = { tag: r.entrou.tagPneu, serie: r.entrou.serie || (velhoE && velhoE.serie) || "", semSerie: !!r.entrou.semSerie, medida: r.entrou.medida, recapagens: r.entrou.recapagens, status: "montado", local, atualizadoEm: agora,
        eventos: comEvento(velhoE, evento(txtE, Object.assign({ om: r.om, tipo: voltou ? "volta_recapagem" : "montagem", reg: r._rid, antes: fotoAntes(velhoE) }, voltou ? { de: velhoE.recapagens ?? null, para: r.entrou.recapagens } : {}))) };
      if (!velhoE) { dE.criadoEm = agora; dE.criadoPor = { matricula: usuario.matricula, nome: usuario.nome }; }
      const tE = tipoDe(r.entrou.tagPneu); if (tE) dE.tipo = tE.codigo;
      filaPneu(r.entrou.tagPneu, dE);
    });
    LS.set("fila", fila);
    atualizarStatus(); enviarFila(); renderCtrl();
    mostrarSalvo(regs);
  });

  function mostrarSalvo(regs) {
    const r0 = regs[0];
    const linhas = regs.map((r) => "eixo " + r.posicao.eixo + " " + r.posicao.lado.toLowerCase() + (r.posicao.posicao ? " " + r.posicao.posicao.toLowerCase() : "") +
      (r.servico === "conserto" ? " (conserto no local, pneu " + (r.saiu.tagPneu || r.saiu.serie) + ")" : " (saiu " + r.saiu.serie + ", entrou " + r.entrou.serie + ")"));
    $("#salvo-texto").textContent = r0.equipamento.tag + " · OM " + r0.om + " · " + (F.juntar ? "juntado ao chamado já existente · " : "") + (regs.length === 1 ? "1 pneu: " : regs.length + " pneus: ") + linhas.join("; ") + "." +
      (navigator.onLine && db ? "" : " Sem conexão agora: o registro fica guardado no tablet e é enviado sozinho quando a internet voltar.");
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

  /* ---------- pneus: cadastro e atualização ---------- */
  let C = {};
  function grupoSimples(sel, aoMudar) {
    $(sel).addEventListener("click", (e) => {
      const b = e.target.closest("button[data-v]"); if (!b) return;
      $$(sel + " button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      aoMudar(b.dataset.v);
    });
  }
  function marcar(sel, v) { $$(sel + " button").forEach((x) => x.setAttribute("aria-pressed", String(v !== null && v !== undefined && x.dataset.v === String(v)))); }
  function aplicarMacicoCad() {
    const m = EH_MACICO(C.tipo);
    $("#c-recap-bloco").hidden = m; $("#c-macico").hidden = !m;
    if (m) { C.recap = 0; marcar("#c-recap", null); }
  }
  grupoSimples("#c-tipo", (v) => { C.tipo = v; C.confirmaDup = null; aplicarMacicoCad(); });
  grupoSimples("#c-recap", (v) => { C.recap = v; C.situacao = Number(v) === 0 ? "estoque" : "patio"; marcar("#c-situacao", C.situacao); });
  grupoSimples("#c-situacao", (v) => { C.situacao = v; });
  grupoSimples("#a-situacao", (v) => {
    C.aSituacao = v;
    const pn = C.aTag && pneuPorTag(C.aTag);
    if (pn && pn.status === "recapagem" && (v === "patio" || v === "estoque") && Number(C.aRecap) === Number(pn.recapagens)) {
      C.aRecap = Math.min(10, (Number(pn.recapagens) || 0) + 1); marcar("#a-recap", C.aRecap);
      $("#pend-atu").innerHTML = '<div class="tag-aviso">Voltou da recapagem: marcado como ' + C.aRecap + "ª recapagem. Confira.</div>";
    }
  });
  grupoSimples("#a-recap", (v) => { C.aRecap = v; });

  function abrirPneus(modo) {
    $("#quem-pneus").textContent = "Borracheiro: " + usuario.nome + " · " + usuario.matricula;
    const med = LS.get("medidas", []);
    $("#medidas").innerHTML = med.map((m) => '<option value="' + esc(m) + '">').join("");
    novoCadastro(false);
    limparAtualizacao();
    modoPneus(modo || "novo");
    ir("pneus");
  }
  function modoPneus(m) {
    $$("#abas-pneus button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.modo === m)));
    $("#cad-novo").hidden = m !== "novo"; $("#cad-atualizar").hidden = m !== "atualizar";
  }
  $("#abas-pneus").addEventListener("click", (e) => { const b = e.target.closest("button[data-modo]"); if (b) modoPneus(b.dataset.modo); });
  function novoCadastro(manterLote) {
    const lote = manterLote ? { tipo: C.tipo, marca: $("#c-marca").value, recap: C.recap, situacao: C.situacao } : {};
    C = { tipo: lote.tipo || null, recap: lote.recap ?? null, situacao: lote.situacao || "estoque" };
    $("#c-serie").value = ""; $("#c-serie").disabled = false; $("#c-semserie").setAttribute("aria-pressed", "false"); $("#c-semserie").textContent = "Pneu sem nº de série"; $("#c-dot").value = ""; $("#c-marca").value = lote.marca || "";
    marcar("#c-tipo", C.tipo); marcar("#c-recap", C.recap); marcar("#c-situacao", C.situacao); aplicarMacicoCad();
    $("#pend-cad").innerHTML = ""; $("#c-cad").classList.remove("falta");
  }
  $("#b-cadastrar").addEventListener("click", async () => {
    const faltas = [];
    const serie = $("#c-serie").value.trim().toUpperCase();
    const tipo = C.tipo && TIPOS_MAP[C.tipo], medida = tipo ? tipo.medida : "";
    const semSerie = $("#c-semserie").getAttribute("aria-pressed") === "true";
    if (!serie && !semSerie) faltas.push("Nº de série (se o pneu não tem, toque em “Pneu sem nº de série”)");
    if (!tipo) faltas.push("Tipo de pneu");
    const macico = EH_MACICO(C.tipo);
    if (!macico && (C.recap === null || C.recap === undefined)) faltas.push("Recapagens (0 se for novo)");
    const dot = $("#c-dot").value.trim();
    if (dot && (!/^\d{4}$/.test(dot) || Number(dot.slice(0, 2)) < 1 || Number(dot.slice(0, 2)) > 53)) faltas.push("DOT: 4 números, semana (01 a 53) + ano (ex.: 5025)");
    if (faltas.length) {
      $("#c-cad").classList.add("falta");
      $("#pend-cad").innerHTML = '<div class="pendencias">Confira:<ul>' + faltas.map((f) => "<li>" + esc(f) + "</li>").join("") + "</ul></div>";
      return;
    }
    const avisosCad = [];
    if (SERIE_SUSPEITA(serie)) avisosCad.push("A série “" + serie + "” parece incompleta. Confira no pneu.");
    if (avisosCad.length && C.confirmaDup !== serie) {
      C.confirmaDup = serie;
      $("#pend-cad").innerHTML = '<div class="pendencias avisos">Confira antes de cadastrar:<ul>' + avisosCad.map((f) => "<li>" + esc(f) + "</li>").join("") + "</ul>Se estiver certo (é outro pneu), toque em <b>Cadastrar e gerar TAG</b> de novo.</div>";
      return;
    }
    const btn = $("#b-cadastrar"); btn.disabled = true; btn.textContent = "Gerando marcação…";
    let tag;
    try { tag = await gerarTag(tipo.codigo); }
    catch (e) {
      $("#pend-cad").innerHTML = '<div class="pendencias">' + esc(msgErroTag(e, tipo.codigo)) + "</div>";
      btn.disabled = false; btn.textContent = "Cadastrar e gerar TAG"; return;
    }
    btn.disabled = false; btn.textContent = "Cadastrar e gerar TAG";
    const agora = new Date().toISOString();
    const marca = $("#c-marca").value.trim();
    const recap = macico ? null : Number(C.recap);
    filaPneu(tag, { tag, tipo: tipo.codigo, serie: semSerie ? "" : serie, semSerie, dot, medida, marca, recapagens: recap, status: C.situacao, local: null, criadoEm: agora, atualizadoEm: agora,
      criadoPor: { matricula: usuario.matricula, nome: usuario.nome },
      eventos: [evento("Cadastrado · " + (NOME_STATUS[C.situacao] || C.situacao) + " · " + (macico ? "maciço" : recap === 0 ? "novo" : recap + "ª recapagem") + (dot ? " · DOT " + dot : ""), { tipo: "cadastro" })] });
    C.confirmaDup = null;
    LS.set("fila", fila);
    const med = LS.get("medidas", []); if (!med.includes(medida)) { med.unshift(medida); LS.set("medidas", med.slice(0, 30)); }
    atualizarStatus(); enviarFila();
    $("#tg-tag").textContent = tag;
    $("#tg-tipo").textContent = "Pneu nº " + tag.slice(0, 3) + " · tipo " + nomeTipo(tipo.codigo);
    $("#tg-resumo").textContent = (semSerie ? "Sem nº de série" : "Série " + serie) + (dot ? " · DOT " + dot : "") + (marca ? " · " + marca : "") + " · " + (macico ? "maciço" : recap === 0 ? "novo" : recap + "ª recapagem") + " · " + NOME_STATUS[C.situacao] + "." +
      (navigator.onLine && db ? "" : " Sem conexão agora: o cadastro sobe sozinho quando a internet voltar.");
    ir("tag");
  });
  $("#b-cad-outro").addEventListener("click", () => { novoCadastro(true); modoPneus("novo"); ir("pneus"); setTimeout(() => $("#c-serie").focus(), 50); });
  $("#c-serie").addEventListener("input", () => { C.confirmaDup = null; });
  $("#c-semserie").addEventListener("click", () => {
    const b = $("#c-semserie"), sem = b.getAttribute("aria-pressed") !== "true";
    b.setAttribute("aria-pressed", String(sem)); b.textContent = sem ? "✓ Pneu sem nº de série" : "Pneu sem nº de série";
    $("#c-serie").disabled = sem; if (sem) $("#c-serie").value = "";
    $("#c-cad").classList.remove("falta");
  });
  $("#b-cad-sair").addEventListener("click", () => { usuario = null; ir("inicio"); });
  $("#b-sair-pneus").addEventListener("click", () => { usuario = null; ir("inicio"); });

  function limparAtualizacao() {
    C.aTag = null; C.aSituacao = null; C.aRecap = null;
    $("#a-tag").value = ""; $("#a-obs").value = ""; $("#a-ficha").innerHTML = "";
    $("#a-campos").hidden = true; $("#b-atualizar").hidden = true; $("#pend-atu").innerHTML = "";
  }
  $("#a-tag").addEventListener("input", () => {
    const tag = normTag($("#a-tag").value);
    const pn = pneuPorTag(tag);
    $("#pend-atu").innerHTML = "";
    if (!tag) { $("#a-ficha").innerHTML = ""; $("#a-campos").hidden = true; $("#b-atualizar").hidden = true; return; }
    if (!pn) {
      $("#a-ficha").innerHTML = '<div class="tag-erro" style="margin-top:10px">' + (!tipoDe(tag) ? (TIPOS_MAP[tag.slice(0, 3)] ? "Parece que a ordem está invertida: primeiro o nº do pneu, depois o código do tipo." : "O código de tipo " + esc(tag.slice(4)) + " não existe na legenda.") : "O pneu " + esc(tag) + " não está cadastrado. Confira a marcação.") + "</div>";
      $("#a-campos").hidden = true; $("#b-atualizar").hidden = true; C.aTag = null; return;
    }
    if (C.aTag !== tag) {
      C.aTag = tag; C.aSituacao = pn.status === "montado" ? null : pn.status; C.aRecap = pn.recapagens;
      marcar("#a-situacao", C.aSituacao); marcar("#a-recap", C.aRecap); $("#a-obs").value = "";
    }
    $("#a-ficha").innerHTML = '<div class="tag-ok" style="margin-top:10px"><b>' + esc(tag) + "</b> · série " + esc(pn.serie || "—") + (pn.medida ? " · " + esc(pn.medida) : "") + (pn.marca ? " · " + esc(pn.marca) : "") +
      (textoRecap(pn.recapagens) ? " · " + esc(textoRecap(pn.recapagens)) : "") + "<small>" + esc(textoStatus(pn)) + "</small></div>" +
      (pn.status === "montado" ? '<div class="tag-aviso">Este pneu está montado. Para tirar do equipamento, registre uma troca. Só altere aqui se o sistema estiver errado.</div>' : "");
    $("#a-campos").hidden = false; $("#b-atualizar").hidden = false;
  });
  $("#b-atualizar").addEventListener("click", () => {
    const tag = C.aTag, pn = pneuPorTag(tag);
    if (!pn) return;
    if (!C.aSituacao) { $("#pend-atu").innerHTML = '<div class="pendencias">Escolha onde o pneu está agora.</div>'; return; }
    const agora = new Date().toISOString();
    const recap = C.aRecap === null || C.aRecap === undefined ? pn.recapagens : Number(C.aRecap);
    const mudou = [];
    if (C.aSituacao !== pn.status) mudou.push((NOME_STATUS[pn.status] || "?") + " → " + NOME_STATUS[C.aSituacao]);
    if (recap !== pn.recapagens) mudou.push("recapagens " + (pn.recapagens ?? "?") + " → " + recap);
    const obs = $("#a-obs").value.trim();
    if (!mudou.length && !obs) { $("#pend-atu").innerHTML = '<div class="pendencias">Nada foi alterado.</div>'; return; }
    filaPneu(tag, { status: C.aSituacao, local: C.aSituacao === "montado" ? pn.local : null, recapagens: recap, atualizadoEm: agora,
      eventos: comEvento(pn, evento("Atualizado" + (mudou.length ? ": " + mudou.join(" · ") : "") + (obs ? " · " + obs : ""),
        pn.status === "recapagem" && (C.aSituacao === "patio" || C.aSituacao === "estoque") && recap !== pn.recapagens ? { tipo: "volta_recapagem", de: pn.recapagens ?? null, para: recap }
        : C.aSituacao === "recapagem" && pn.status !== "recapagem" ? { tipo: "enviado_recapagem" } : { tipo: "atualizacao" })) });
    LS.set("fila", fila); atualizarStatus(); enviarFila(); renderCtrl();
    limparAtualizacao();
    $("#pend-atu").innerHTML = '<div class="msg-ok">Pneu ' + esc(tag) + " atualizado" + (mudou.length ? ": " + esc(mudou.join(" · ")) : "") + ".</div>";
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
    $("#ctrl-lista").hidden = false; $("#ctrl-detalhe").hidden = true; tagAberta = null; pneuAberto = null;
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
    const m = new Map(registrosCtrl.map((r) => [r._id, r]));
    const pend = new Map();
    fila.forEach((f) => {
      if (f.col || !f.data) return;
      if (m.has(f.id)) m.set(f.id, Object.assign({}, m.get(f.id), f.data));
      else if (pend.has(f.id)) pend.set(f.id, Object.assign({}, pend.get(f.id), f.data));
      else if (f.data.tag) pend.set(f.id, Object.assign({ _id: f.id, _pendente: true }, f.data));
    });
    return [...pend.values()].concat([...m.values()]).sort((a, b) => String(b.dataHora).localeCompare(String(a.dataHora)));
  }
  /* histórico: por data ou por equipamento */
  let vistaCtrl = "data";
  let periodo = "30";
  function intervalo() {
    if (periodo === "tudo") return [null, null];
    if (periodo === "custom") return [$("#i-de").value || null, $("#i-ate").value || null];
    const d = new Date(); d.setDate(d.getDate() - (periodo === "hoje" ? 0 : Number(periodo) - 1));
    return [hojeISO(d), hojeISO()];
  }
  function setPeriodo(p) {
    periodo = p;
    $$("#periodos button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.p === p)));
    if (p !== "custom") { const [de, ate] = intervalo(); $("#i-de").value = de || ""; $("#i-ate").value = ate || ""; }
    renderCtrl();
  }
  $("#periodos").addEventListener("click", (e) => { const b = e.target.closest("button[data-p]"); if (b) setPeriodo(b.dataset.p); });
  ["#i-de", "#i-ate"].forEach((s) => $(s).addEventListener("change", () => setPeriodo("custom")));
  $("#abas-ctrl").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-vista]"); if (!b) return;
    vistaCtrl = b.dataset.vista;
    $$("#abas-ctrl button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    renderCtrl();
  });

  function bateBusca(r, q) {
    if (!q) return true;
    const e = r.equipamento || {};
    return [r.tag, e.descricao, e.area, e.familia, r.om, r.borracheiro && r.borracheiro.nome, r.saiu && r.saiu.serie, r.entrou && r.entrou.serie, r.saiu && r.saiu.tagPneu, r.entrou && r.entrou.tagPneu]
      .some((v) => norm(v).includes(q));
  }
  /* chamado = mesmo equipamento + mesma OM (junta lançamentos separados da mesma OM) */
  const chaveCham = (r) => (r.om && r.tag ? r.tag + "|" + String(r.om).trim() : (r.chamadoId || r._id));
  function agruparChamados(rs) {
    const m = new Map();
    rs.forEach((r) => { const k = chaveCham(r); if (!m.has(k)) m.set(k, []); m.get(k).push(r); });
    return Array.from(m.values()).sort((a, b) => String(b[0].dataHora).localeCompare(String(a[0].dataHora)));
  }
  function rotuloDia(iso) {
    if (!iso) return "Sem data";
    const hoje = hojeISO(); const o = new Date(); o.setDate(o.getDate() - 1);
    if (iso === hoje) return "Hoje · " + fmtData(iso);
    if (iso === hojeISO(o)) return "Ontem · " + fmtData(iso);
    const [y, m, d] = iso.split("-").map(Number);
    const sem = new Date(y, m - 1, d).toLocaleDateString("pt-BR", { weekday: "long" });
    return sem.charAt(0).toUpperCase() + sem.slice(1) + " · " + fmtData(iso);
  }
  const plural = (n, um, varios) => n + " " + (n === 1 ? um : varios);
  function htmlDias(rs, mostrarEquip) {
    const chamados = agruparChamados(rs);
    const dias = new Map();
    chamados.forEach((g) => { const k = g[0].dataServico || ""; if (!dias.has(k)) dias.set(k, []); dias.get(k).push(g); });
    return Array.from(dias.entries()).map(([dia, gs]) => {
      const pneusDia = gs.reduce((s, g) => s + g.length, 0);
      return '<section class="dia"><h3 class="dia-cab"><span>' + esc(rotuloDia(dia)) + "</span><small>" + plural(gs.length, "chamado", "chamados") + " · " + plural(pneusDia, "pneu", "pneus") + "</small></h3>" +
        gs.map((g) => htmlChamado(g, mostrarEquip)).join("") + "</section>";
    }).join("");
  }
  const txtSerie = (o) => (o && o.serie ? esc(o.serie) : o && o.serieInformada ? esc(o.serieInformada) + " <small>(não conferida)</small>" : "—");
  let corrigindo = null;
  function htmlCorrecao(x) {
    let h = "";
    if (x.correcao) {
      const c = x.correcao;
      h += '<p class="correcao-nota"><b>Corrigido em ' + esc(fmtDataHora(c.em)) + ":</b> " + esc(c.motivo) +
        (c.marcacoesAntes ? " · marcação registrada antes: " + esc(Object.values(c.marcacoesAntes).filter(Boolean).join(" e ")) : "") + "</p>";
    }
    if (x.correcao) return h;
    const tS = x.saiu && x.saiu.tagPneu, tE = x.servico !== "conserto" && x.entrou && x.entrou.tagPneu;
    if (!tS && !tE) return h;
    if (corrigindo !== x._id) return h + '<button class="btn-corrigir" data-corrigir="' + esc(x._id) + '">Corrigir pneus</button>';
    return h + '<div class="corrigir-form" data-form="' + esc(x._id) + '"><p class="corrigir-tit">Corrigir pneus deste lançamento</p>' +
      '<p class="corrigir-dica">Use quando o borracheiro registrou a marcação errada. O lançamento continua valendo, o pneu fica como “sem marcação” e volta a aparecer onde estava antes.</p>' +
      (tS ? '<label><input type="checkbox" data-c="saiu" checked> O pneu que saiu não é o ' + esc(tS) + "</label>" : "") +
      (tE ? '<label><input type="checkbox" data-c="entrou" checked> O pneu que entrou não é o ' + esc(tE) + "</label>" : "") +
      '<label><input type="checkbox" data-c="serie" checked> As séries também não foram conferidas</label>' +
      '<input class="campo" data-c="motivo" placeholder="Motivo (ex.: pneus sem marcação, números copiados de outro lançamento)">' +
      '<p class="corrigir-erro" data-c="erro"></p>' +
      '<div class="corrigir-bts"><button class="btn-sec" data-corrigir-ok="' + esc(x._id) + '">Confirmar correção</button><button class="btn-sec" data-corrigir-nao>Cancelar</button></div></div>';
  }
  /* estado do pneu antes do lançamento: pela foto guardada no evento ou pelo último lançamento anterior */
  function estadoAntes(tag, r, evs) {
    const ev = evs.find((e) => e.antes !== undefined);
    if (ev) return ev.antes ? { status: ev.antes.status, local: ev.antes.local, recapagens: ev.antes.recapagens } : null;
    const u = todosRegistros().filter((x) => x._id !== r._id && String(x.dataHora) <= String(r.dataHora) &&
      ((x.saiu && x.saiu.tagPneu === tag) || (x.entrou && x.servico !== "conserto" && x.entrou.tagPneu === tag)))[0];
    if (!u) return undefined;
    const loc = { equipTag: u.tag, equipDesc: (u.equipamento && u.equipamento.descricao) || "", eixo: u.posicao.eixo, lado: u.posicao.lado, posicao: u.posicao.posicao || null };
    if (u.servico === "conserto") return { status: "montado", local: loc, recapagens: u.saiu.recapagens ?? null };
    if (u.entrou && u.entrou.tagPneu === tag) return { status: "montado", local: loc, recapagens: u.entrou.recapagens ?? null };
    return { status: ({ Conserto: "conserto", Recapagem: "recapagem", "Pátio": "patio", Estoque: "patio", Sucata: "sucata" })[u.saiu.destino] || "patio", local: null, recapagens: u.saiu.recapagens ?? null };
  }
  function corrigirLancamento(id, lados, serieNao, motivo) {
    const r = todosRegistros().find((x) => x._id === id); if (!r) return [];
    const agora = new Date().toISOString(), avisos = [];
    const t0 = new Date(r.criadoEm || r.dataHora).getTime();
    const doReg = (e) => e.reg ? e.reg === id : (String(e.om || "") === String(r.om || "") && String(e.texto || "").includes(r.tag) && Math.abs(new Date(e.data).getTime() - t0) < 15 * 60000);
    const upd = { correcao: { em: agora, por: "Controlador", motivo, lados, marcacoesAntes: {} } };
    lados.forEach((lado) => {
      const tag = r[lado] && r[lado].tagPneu; if (!tag) return;
      upd.correcao.marcacoesAntes[lado] = tag;
      const pn = pneuPorTag(tag);
      const evs = ((pn && pn.eventos) || []).filter(doReg);
      const resto = ((pn && pn.eventos) || []).filter((e) => !doReg(e));
      const novo = Object.assign({}, r[lado], { tagPneu: "", tagErrada: tag });
      if (serieNao && novo.serie) { novo.serieInformada = novo.serie; novo.serie = ""; }
      upd[lado] = novo;
      if (r.servico === "conserto" && lado === "saiu") upd.entrou = Object.assign({}, r.entrou, { tagPneu: "", tagErrada: tag }, serieNao ? { serie: "", serieInformada: r.entrou.serie } : {});
      if (!pn) return;
      const d = { atualizadoEm: agora, eventos: resto.concat([{ data: agora, por: "Controlador", tipo: "correcao", texto: "Correção: o lançamento de " + fmtData(r.dataServico) + " " + (r.horaServico || "") + " em " + r.tag + " não era deste pneu · " + motivo }]).slice(-60) };
      const est = estadoAntes(tag, r, evs);
      const criadoAqui = !pn.criadoEm || Math.abs(new Date(pn.criadoEm).getTime() - t0) < 15 * 60000 && !resto.length;
      if (est) Object.assign(d, { status: est.status, local: est.local, recapagens: est.recapagens ?? pn.recapagens ?? null });
      else if (criadoAqui) { Object.assign(d, { status: "patio", local: null }); avisos.push("A marcação " + tag + " foi criada nesse lançamento. Ela ficou no Pátio: confira se esse pneu existe."); }
      else avisos.push("Não encontrei onde o pneu " + tag + " estava antes. Confira a situação dele na ficha.");
      filaPneu(tag, d);
    });
    if (serieNao && !upd.saiu && r.saiu && r.saiu.serie) upd.saiu = Object.assign({}, r.saiu, { serie: "", serieInformada: r.saiu.serie });
    if (serieNao && !upd.entrou && r.entrou && r.entrou.serie && r.servico !== "conserto") upd.entrou = Object.assign({}, r.entrou, { serie: "", serieInformada: r.entrou.serie });
    fila.push({ id, data: upd, merge: true }); LS.set("fila", fila);
    enviarFila(); renderCtrl();
    return avisos;
  }
  function tratarCorrecao(e) {
    const b = e.target.closest("[data-corrigir]");
    if (b) { corrigindo = b.dataset.corrigir; renderCtrl(); if (tagAberta) renderDetalhe(tagAberta); return true; }
    if (e.target.closest("[data-corrigir-nao]")) { corrigindo = null; renderCtrl(); if (tagAberta) renderDetalhe(tagAberta); return true; }
    const ok = e.target.closest("[data-corrigir-ok]");
    if (ok) {
      const f = ok.closest("[data-form]");
      const lados = [...f.querySelectorAll('input[type=checkbox]:checked')].map((c) => c.dataset.c).filter((c) => c === "saiu" || c === "entrou");
      const serieNao = !!f.querySelector('[data-c="serie"]:checked');
      const motivo = f.querySelector('[data-c="motivo"]').value.trim();
      const erro = f.querySelector('[data-c="erro"]');
      if (!lados.length && !serieNao) { erro.textContent = "Marque o que está errado."; return true; }
      if (motivo.length < 5) { erro.textContent = "Escreva o motivo da correção."; return true; }
      corrigindo = null;
      const av = corrigirLancamento(ok.dataset.corrigirOk, lados, serieNao, motivo);
      if (tagAberta) renderDetalhe(tagAberta);
      if (av.length) setTimeout(() => { const n = document.querySelector(".correcao-nota"); if (n) n.insertAdjacentHTML("afterend", '<p class="corrigir-erro">' + av.map(esc).join("<br>") + "</p>"); }, 50);
      return true;
    }
    return !!e.target.closest(".corrigir-form");
  }
  function htmlChamado(g, mostrarEquip) {
    g.sort((a, b) => (a.pneuNumero || 0) - (b.pneuNumero || 0));
    const r = g[0];
    const e = equip.find((x) => x.tag === r.tag) || r.equipamento || { tag: r.tag };
    const pendente = g.some((x) => x._pendente);
    const det = [
      r.om ? "<span><b>OM</b>" + esc(r.om) + "</span>" : "",
      r.leitura ? "<span><b>" + (r.leitura.unidade === "H" ? "Horímetro" : "KM") + "</b>" + esc(Number(r.leitura.valor).toLocaleString("pt-BR")) + (r.leitura.unidade === "H" ? " h" : " km") + "</span>" : (r.semLeitura ? "<span><b>Horímetro</b>sem</span>" : ""),
      g.length > 1 ? "<span><b>Pneus</b>" + g.length + "</span>" : "",
      r.observacoes ? "<span><b>Obs.</b>" + esc(r.observacoes) + "</span>" : ""
    ].join("");
    let quando = esc(r.horaServico || "");
    if (r.fim && r.fim.hora) {
      quando += " → " + (r.fim.data !== r.dataServico ? esc(fmtData(r.fim.data)) + " " : "") + esc(r.fim.hora);
      if (typeof r.duracaoMin === "number") quando += ' <small style="font-family:var(--f-corpo);font-size:16px;color:var(--muted)">(' + fmtDur(r.duracaoMin) + ")</small>";
    }
    const lancs = {}; g.forEach((x) => { lancs[(x.chamadoId || x._id) + "|" + x.dataHora] = x; });
    const lv = Object.values(lancs).sort((a, b) => String(a.dataHora).localeCompare(String(b.dataHora)));
    if (lv.length > 1) quando = lv.map((x) => esc(x.horaServico || "") + (x.fim && x.fim.hora ? "→" + esc(x.fim.hora) : "")).join(" · ") +
      ' <small style="font-family:var(--f-corpo);font-size:16px;color:var(--muted)">(' + fmtDur(lv.reduce((s, x) => s + (typeof x.duracaoMin === "number" ? x.duracaoMin : 0), 0)) + ", " + lv.length + " lançamentos)</small>";
    const blocos = g.map((x) => {
      const p = x.posicao || {};
      const motivo = x.motivo === "Pneu com defeito" ? "Pneu com defeito: " + (x.defeito === "Outro" ? x.motivoTexto : x.defeito) : (x.motivo === "Outro" ? "Outro: " + x.motivoTexto : x.motivo);
      const linkS = x.saiu.tagPneu ? '<dt>TAG</dt><dd><button class="link-pneu" data-pneu="' + esc(x.saiu.tagPneu) + '">' + esc(x.saiu.tagPneu) + "</button></dd>" : "";
      if (x.servico === "conserto") {
        return '<div class="chamado-pneu">' + (g.length > 1 ? '<span class="np">Pneu ' + (x.pneuNumero || "") + "</span>" : "") +
          htmlCorrecao(x) +
          '<div class="pos"><span class="chip">Eixo ' + esc(p.eixo) + '</span><span class="chip">' + esc(p.lado) + "</span>" + (p.posicao ? '<span class="chip">' + esc(p.posicao) + "</span>" : "") + '<span class="chip">' + esc(motivo) + "</span></div>" +
          '<div class="par-um"><section class="saiu conserto-sec"><h4>Conserto no local ' + textoSaiu(x.saiu) + '</h4><dl class="kv"><dt>Série</dt><dd>' + txtSerie(x.saiu) + "</dd>" + (x.saiu.tagErrada ? "<dt>TAG</dt><dd>sem marcação</dd>" : "") + linkS + "<dt>Resultado</dt><dd>O mesmo pneu voltou para o equipamento</dd></dl></section></div></div>";
      }
      return '<div class="chamado-pneu">' +
        (g.length > 1 ? '<span class="np">Pneu ' + (x.pneuNumero || "") + "</span>" : "") +
        htmlCorrecao(x) +
        '<div class="pos"><span class="chip">Eixo ' + esc(p.eixo) + '</span><span class="chip">' + esc(p.lado) + "</span>" + (p.posicao ? '<span class="chip">' + esc(p.posicao) + "</span>" : "") + '<span class="chip">' + esc(motivo) + "</span></div>" +
        '<div class="par"><section class="saiu"><h4>Saiu ' + textoSaiu(x.saiu) + '</h4><dl class="kv"><dt>Série</dt><dd>' + txtSerie(x.saiu) + "</dd>" + (x.saiu.tagErrada ? "<dt>TAG</dt><dd>sem marcação</dd>" : "") + (x.saiu.tagPneu ? '<dt>TAG</dt><dd><button class="link-pneu" data-pneu="' + esc(x.saiu.tagPneu) + '">' + esc(x.saiu.tagPneu) + "</button></dd>" : "") + "<dt>Destino</dt><dd>" + esc(x.saiu.destino) + "</dd></dl></section>" +
        '<section class="entrou"><h4>Entrou ' + textoCondicao(x.entrou) + '</h4><dl class="kv"><dt>Série</dt><dd>' + txtSerie(x.entrou) + "</dd>" + (x.entrou.tagErrada ? "<dt>TAG</dt><dd>sem marcação</dd>" : "") + (x.entrou.tagPneu ? '<dt>TAG</dt><dd><button class="link-pneu" data-pneu="' + esc(x.entrou.tagPneu) + '">' + esc(x.entrou.tagPneu) + "</button></dd>" : "") + "<dt>Medida</dt><dd>" + esc(x.entrou.medida) + "</dd></dl></section></div></div>";
    }).join("");
    return '<article class="registro">' +
      (mostrarEquip ? '<button class="equip-link" data-tag="' + esc(r.tag) + '"><b>' + esc(r.tag) + "</b><span>" + esc([e.descricao, e.area].filter(Boolean).join(" · ")) + "</span></button>" : "") +
      '<div class="topo-reg"><span class="quando">' + quando + "</span>" +
      '<span class="por">' + esc(r.borracheiro.nome) + " · " + esc(r.borracheiro.matricula) + (pendente ? ' <span class="selo pend">Aguardando envio</span>' : "") + "</span></div>" +
      (det ? '<div class="detalhes">' + det + "</div>" : "") + blocos + "</article>";
  }

  let pneuAberto = null;
  let filtroStatus = null;
  function renderEstoque() {
    const q = norm($("#i-busca-ctrl").value);
    const todos = todosPneus();
    const box = $("#lista-estoque");
    if (!todos.length) {
      $("#resumo-ctrl").textContent = "";
      box.innerHTML = '<div class="vazio">Nenhum pneu cadastrado ainda.<br>Os pneus aparecem aqui quando o borracheiro cadastra no tablet (“Cadastrar ou atualizar pneu”) ou gera uma TAG na hora da troca.</div>';
      return;
    }
    const ordem = ["estoque", "patio", "montado", "recapagem", "conserto", "sucata"];
    const cont = {}; ordem.forEach((s) => (cont[s] = 0)); todos.forEach((p) => (cont[p.status] = (cont[p.status] || 0) + 1));
    const chips = '<div class="status-chips" id="chips-status"><button data-st="" aria-pressed="' + (!filtroStatus) + '"><b>' + todos.length + "</b><span>Todos</span></button>" +
      ordem.map((s) => '<button data-st="' + s + '" aria-pressed="' + (filtroStatus === s) + '"><b>' + cont[s] + "</b><span>" + NOME_STATUS[s] + "</span></button>").join("") + "</div>";
    const prontos = todos.filter((p) => p.status === "estoque" || p.status === "patio");
    const porMed = {};
    const codDe = (p) => p.tipo || (tipoDe(p.tag) || {}).codigo || "—";
    todos.forEach((p) => { const m = codDe(p); porMed[m] = porMed[m] || { n: 0, est: 0, pat: 0, usados: 0 }; porMed[m].usados++; });
    prontos.forEach((p) => { const m = codDe(p); porMed[m].n++; if (p.status === "estoque") porMed[m].est++; else porMed[m].pat++; });
    const meds = Object.keys(porMed).sort();
    const tabela = meds.length ? '<div class="tabela-medidas"><table><thead><tr><th>Tipo</th><th style="text-align:right">Estoque (novos)</th><th style="text-align:right">Pátio (usados)</th><th style="text-align:right">Prontos</th><th style="text-align:right">Nº usados</th><th style="text-align:right">Livres</th></tr></thead><tbody>' +
      meds.map((m) => "<tr><td><b>" + esc(m) + "</b> " + esc(TIPOS_MAP[m] ? TIPOS_MAP[m].medida : "") + '</td><td class="n">' + porMed[m].est + '</td><td class="n">' + porMed[m].pat + '</td><td class="n">' + porMed[m].n + '</td><td class="n">' + porMed[m].usados + '</td><td class="n">' + Math.max(0, 1000 - porMed[m].usados) + "</td></tr>").join("") + "</tbody></table></div>" : "";
    const lista = todos.filter((p) => (!filtroStatus || p.status === filtroStatus) &&
      (!q || [p.tag, p.serie, p.medida, p.marca, p.local && p.local.equipTag].some((v) => norm(v).includes(q))))
      .sort((a, b) => (String(a.tag).slice(4) + String(a.tag).slice(0, 3)).localeCompare(String(b.tag).slice(4) + String(b.tag).slice(0, 3)));
    $("#resumo-ctrl").textContent = todos.length + (todos.length === 1 ? " pneu cadastrado" : " pneus cadastrados") + (filtroStatus || q ? " · mostrando " + lista.length : "");
    box.innerHTML = chips + (filtroStatus && filtroStatus !== "estoque" && filtroStatus !== "patio" ? "" : tabela) +
      (lista.length ? '<div class="lista-pneus-est">' + lista.map((p) =>
        '<button data-pneu="' + esc(p.tag) + '"><span class="tg">' + esc(p.tag) + '</span><span class="md"><strong>' + esc(p.medida || "Medida não informada") + (p.marca ? " · " + esc(p.marca) : "") + "</strong><small>Série " + esc(p.serie || "—") + " · " + esc(textoRecap(p.recapagens) || "recapagens não informadas") + "</small></span>" +
        '<span class="selo st-' + esc(p.status) + '">' + esc(p.status === "montado" && p.local ? "Montado · " + p.local.equipTag : NOME_STATUS[p.status] || "?") + "</span></button>").join("") + "</div>"
        : '<div class="vazio">Nenhum pneu com esse filtro.</div>');
  }
  function fmtDataHora(iso) { const d = new Date(iso); return isNaN(d) ? "" : fmtData(hojeISO(d)) + " " + horaHM(d); }
  function renderFichaPneu(tag) {
    const pn = pneuPorTag(tag);
    if (!pn) { $("#detalhe-conteudo").innerHTML = '<div class="vazio">Pneu ' + esc(tag) + " não encontrado.</div>"; return; }
    const cab = '<div class="cab-equip"><span class="tag">' + esc(tag) + '</span><span class="desc">' + esc(pn.medida || "Medida não informada") + (pn.marca ? " · " + esc(pn.marca) : "") + '</span><div class="chips">' +
      '<span class="selo st-' + esc(pn.status) + '" style="font-size:15px;padding:4px 12px">' + esc(textoStatus(pn)) + "</span>" +
      '<span class="chip">Série ' + esc(pn.serie || "—") + "</span>" + (pn.dot ? '<span class="chip">DOT ' + esc(pn.dot) + "</span>" : "") + (textoRecap(pn.recapagens) ? '<span class="chip">' + esc(textoRecap(pn.recapagens)) + "</span>" : "") +
      (pn.criadoEm ? '<span class="chip">Cadastrado em ' + esc(fmtData(hojeISO(new Date(pn.criadoEm)))) + (pn.criadoPor ? " por " + esc(pn.criadoPor.nome) : "") + "</span>" : "") + "</div></div>";
    const evs = (pn.eventos || []).slice().reverse();
    const lista = evs.length ? '<div class="ficha-eventos">' + evs.map((ev) => "<div><time>" + esc(fmtDataHora(ev.data)) + "</time><span>" + esc(ev.texto) + "</span>" +
      ((ev.por || ev.om) ? "<small>" + esc([ev.por, ev.om ? "OM " + ev.om : ""].filter(Boolean).join(" · ")) + "</small>" : "") + "</div>").join("") + "</div>" : '<div class="vazio">Sem movimentações registradas.</div>';
    $("#detalhe-conteudo").innerHTML = cab + '<h3 class="dia-cab" style="margin-top:22px"><span>Vida do pneu</span><small>' + evs.length + (evs.length === 1 ? " movimentação" : " movimentações") + "</small></h3>" + lista;
  }
  function abrirFicha(tag) {
    pneuAberto = tag; tagAberta = null;
    $("#ctrl-lista").hidden = true; $("#ctrl-detalhe").hidden = false; renderFichaPneu(tag); window.scrollTo(0, 0);
  }

  function renderCtrl() {
    if ($("#t-controle").hidden) return;
    if (tagAberta) { renderDetalhe(tagAberta); return; }
    if (pneuAberto) { renderFichaPneu(pneuAberto); return; }
    const porData = vistaCtrl === "data", porEstoque = vistaCtrl === "estoque";
    $("#filtro-periodo").hidden = !porData;
    $("#lista-datas").hidden = !porData;
    $("#lista-equip").hidden = vistaCtrl !== "equip";
    $("#lista-estoque").hidden = !porEstoque;
    if (porEstoque) { renderEstoque(); return; }
    const regs = todosRegistros();
    const q = norm($("#i-busca-ctrl").value);
    const box = porData ? $("#lista-datas") : $("#lista-equip");
    if (!regs.length) {
      $("#resumo-ctrl").textContent = "";
      box.innerHTML = '<div class="vazio">' + (db ? "Nenhuma troca registrada ainda.<br>Cada chamado salvo no tablet aparece aqui." : "Sem conexão com o banco de dados. Os registros aparecem aqui quando a conexão voltar.") + "</div>";
      return;
    }
    if (porData) {
      const [de, ate] = intervalo();
      const filtrados = regs.filter((r) => (!de || String(r.dataServico) >= de) && (!ate || String(r.dataServico) <= ate) && bateBusca(r, q));
      const nCham = agruparChamados(filtrados).length;
      const nCons = filtrados.filter((r) => r.servico === "conserto").length;
      $("#resumo-ctrl").textContent = plural(nCham, "chamado", "chamados") + " · " + plural(filtrados.length - nCons, "pneu trocado", "pneus trocados") + (nCons ? " · " + plural(nCons, "conserto no local", "consertos no local") : "") +
        (de || ate ? " · " + (de ? fmtData(de) : "início") + " a " + (ate ? fmtData(ate) : "hoje") : " · todo o período");
      box.innerHTML = filtrados.length ? htmlDias(filtrados, true) : '<div class="vazio">Nenhuma troca nesse período' + (q ? " com essa busca" : "") + ".<br>Escolha outro período ou toque em “Tudo”.</div>";
      return;
    }
    const grupos = new Map();
    regs.forEach((r) => { if (!grupos.has(r.tag)) grupos.set(r.tag, []); grupos.get(r.tag).push(r); });
    const itens = Array.from(grupos.entries()).map(([tag, rs]) => {
      const e = equip.find((x) => x.tag === tag) || rs[0].equipamento || { tag };
      return { tag, e, rs };
    }).filter((it) => !q || it.rs.some((r) => bateBusca(r, q)));
    $("#resumo-ctrl").textContent = plural(regs.length, "pneu trocado", "pneus trocados") + " em " + plural(grupos.size, "equipamento", "equipamentos") + (q ? " · mostrando " + itens.length : "");
    if (!itens.length) { box.innerHTML = '<div class="vazio">Nenhum equipamento encontrado para essa busca.</div>'; return; }
    box.innerHTML = itens.map((it) => {
      const u = it.rs[0];
      const nCh = agruparChamados(it.rs).length;
      return '<button data-tag="' + esc(it.tag) + '"><span class="tag">' + esc(it.tag) + '</span><span class="meio"><strong>' + esc(it.e.descricao || "") + "</strong><small>" + esc([it.e.familia, it.e.area].filter(Boolean).join(" · ")) + '</small></span><span class="dir"><b>' + nCh + "</b><small>" + (nCh === 1 ? "chamado" : "chamados") + " · última " + esc(fmtData(u.dataServico)) + "</small></span></button>";
    }).join("");
  }
  $("#i-busca-ctrl").addEventListener("input", renderCtrl);
  $("#ctrl-lista").addEventListener("click", (e) => {
    if (tratarCorrecao(e)) return;
    const st = e.target.closest("#chips-status button"); if (st) { filtroStatus = st.dataset.st || null; renderCtrl(); return; }
    const pnb = e.target.closest("[data-pneu]"); if (pnb) { abrirFicha(pnb.dataset.pneu); return; }
    const b = e.target.closest("[data-tag]"); if (!b) return;
    tagAberta = b.dataset.tag; pneuAberto = null; $("#ctrl-lista").hidden = true; $("#ctrl-detalhe").hidden = false; renderDetalhe(tagAberta); window.scrollTo(0, 0);
  });
  $("#detalhe-conteudo").addEventListener("click", (e) => { if (tratarCorrecao(e)) return; const pnb = e.target.closest("[data-pneu]"); if (pnb) abrirFicha(pnb.dataset.pneu); });
  $("#b-voltar-lista").addEventListener("click", () => { pneuAberto = null; tagAberta = null; $("#ctrl-lista").hidden = false; $("#ctrl-detalhe").hidden = true; renderCtrl(); });

  function textoSaiu(sa) {
    if (sa && sa.condicao === "Maciço") return '<span class="selo recap">Maciço</span>';
    if (!sa || (sa.recapagens === null || sa.recapagens === undefined) && !sa.condicao) return "";
    const n = sa.recapagens || 0;
    return '<span class="selo recap">' + (n ? n + "ª recapagem" : "0 recapagem") + "</span>";
  }
  function textoCondicao(en) {
    if (en && en.condicao === "Maciço") return '<span class="selo recap">Maciço</span>';
    if (en.condicao === "Novo") return '<span class="selo novo">Novo</span>';
    return '<span class="selo recap">Recapado' + (en.recapagens ? " · " + en.recapagens + "ª recapagem" : "") + "</span>";
  }
  function renderDetalhe(tag) {
    const rs = todosRegistros().filter((r) => r.tag === tag);
    const e = equip.find((x) => x.tag === tag) || (rs[0] && rs[0].equipamento) || { tag };
    const nCh = agruparChamados(rs).length;
    const cab = '<div class="cab-equip"><span class="tag">' + esc(tag) + '</span><span class="desc">' + esc(e.descricao || "") + '</span><div class="chips">' +
      [e.familia, e.area, e.local ? "Local " + e.local : ""].filter(Boolean).map((c) => '<span class="chip">' + esc(c) + "</span>").join("") +
      '<span class="chip">' + plural(nCh, "chamado", "chamados") + " · " + plural(rs.length, "pneu", "pneus") + "</span></div></div>";
    $("#detalhe-conteudo").innerHTML = cab + (rs.length ? htmlDias(rs, false) : '<div class="vazio">Nenhuma troca registrada neste equipamento.</div>');
  }
  setPeriodo("30");

  /* ---------- exportar Excel ---------- */
  let carregandoXlsx = null;
  function carregarXlsx() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (!carregandoXlsx) carregandoXlsx = new Promise((ok, falha) => {
      const s = document.createElement("script"); s.src = "xlsx.mini.min.js";
      s.onload = () => (window.XLSX ? ok(window.XLSX) : falha(new Error("xlsx")));
      s.onerror = () => { carregandoXlsx = null; falha(new Error("xlsx")); };
      document.head.appendChild(s);
    });
    return carregandoXlsx;
  }
  const dataExcel = (iso) => { if (!iso) return ""; const [y, m, d] = String(iso).split("-").map(Number); return y ? new Date(y, m - 1, d, 12, 0, 0) : ""; };
  const horasMin = (min) => (typeof min === "number" ? Math.floor(min / 60) + ":" + String(min % 60).padStart(2, "0") : "");
  const txtMotivo = (r) => r.motivo === "Pneu com defeito" ? "Pneu com defeito" : (r.motivo || "");
  const txtDefeito = (r) => r.motivo === "Pneu com defeito" ? (r.defeito === "Outro" ? "Outro: " + (r.motivoTexto || "") : (r.defeito || "")) : "";
  const txtPos = (p) => p ? ["Eixo " + p.eixo, p.lado, p.posicao].filter(Boolean).join(" ") : "";
  function folha(XLSX, linhas, larguras) {
    const ws = XLSX.utils.json_to_sheet(linhas, { cellDates: true });
    if (linhas.length) {
      const cab = Object.keys(linhas[0]);
      ws["!cols"] = cab.map((c, i) => ({ wch: (larguras && larguras[i]) || Math.min(40, Math.max(10, c.length + 2)) }));
      ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: linhas.length, c: cab.length - 1 } }) };
      const rng = XLSX.utils.decode_range(ws["!ref"]);
      for (let R = 1; R <= rng.e.r; R++) for (let C = 0; C <= rng.e.c; C++) {
        const cel = ws[XLSX.utils.encode_cell({ r: R, c: C })];
        if (cel && cel.v instanceof Date) { cel.t = "d"; cel.z = "dd/mm/yyyy"; }
      }
    }
    return ws;
  }
  $("#b-excel").addEventListener("click", async () => {
    const btn = $("#b-excel"), msg = $("#msg-excel");
    msg.innerHTML = "";
    const [de, ate] = intervalo();
    const q = norm($("#i-busca-ctrl").value);
    const regs = todosRegistros().filter((r) => (!de || String(r.dataServico) >= de) && (!ate || String(r.dataServico) <= ate) && bateBusca(r, q))
      .sort((a, b) => String(a.dataHora).localeCompare(String(b.dataHora)) || (a.pneuNumero || 0) - (b.pneuNumero || 0));
    const pneusCad = todosPneus();
    if (!regs.length && !pneusCad.length) { msg.innerHTML = '<div class="pendencias">Nenhuma troca nesse período' + (q ? " com essa busca" : "") + ". Escolha outro período ou toque em “Tudo”.</div>"; return; }
    btn.disabled = true;
    let XLSX;
    try { XLSX = await carregarXlsx(); }
    catch (e) { btn.disabled = false; msg.innerHTML = '<div class="pendencias">Não foi possível carregar o gerador de Excel. Abra o app com internet uma vez e tente de novo.</div>'; return; }
    try {
      const chamados = agruparChamados(regs).sort((a, b) => String(a[0].dataHora).localeCompare(String(b[0].dataHora)));
      const idCham = new Map(); chamados.forEach((g, k) => idCham.set(chaveCham(g[0]), k + 1));
      const eqInfo = (r) => equip.find((x) => x.tag === r.tag) || r.equipamento || {};

      /* aba 1: uma linha por pneu trocado */
      const trocas = regs.map((r) => {
        const e = eqInfo(r), p = r.posicao || {}, sa = r.saiu || {}, en = r.servico === "conserto" ? {} : (r.entrou || {});
        return {
          "Data": dataExcel(r.dataServico),
          "Hora entrada": r.horaServico || "",
          "Data saída": dataExcel(r.fim && r.fim.data),
          "Hora saída": (r.fim && r.fim.hora) || "",
          "Duração (h:mm)": horasMin(r.duracaoMin),
          "Duração (min)": typeof r.duracaoMin === "number" ? r.duracaoMin : "",
          "Nº chamado": idCham.get(chaveCham(r)) || "",
          "OM / nota": r.om || "",
          "TAG equipamento": r.tag || "",
          "Descrição do equipamento": e.descricao || "",
          "Família": e.familia || "",
          "Área": e.area || "",
          "Local de instalação (SAP)": e.local || "",
          "KM / Horímetro": r.leitura ? (r.leitura.unidade === "H" ? "Horímetro" : "KM") : (r.semLeitura ? "Sem horímetro" : ""),
          "Leitura": r.leitura ? Number(r.leitura.valor) : "",
          "Borracheiro": (r.borracheiro && r.borracheiro.nome) || "",
          "Matrícula": (r.borracheiro && r.borracheiro.matricula) || "",
          "Pneu do chamado": r.pneuNumero || 1,
          "Pneus no chamado": r.totalPneus || 1,
          "Serviço": r.servico === "conserto" ? "Conserto no local" : "Troca",
          "Eixo": p.eixo ?? "",
          "Lado": p.lado || "",
          "Posição": p.posicao || "",
          "Saiu - nº de série": sa.serie || (sa.serieInformada ? sa.serieInformada + " (não conferida)" : ""),
          "Saiu - marcação do pneu": sa.tagPneu || "",
          "Saiu - tipo do pneu": tipoDe(sa.tagPneu) ? nomeTipo(tipoDe(sa.tagPneu).codigo) : "",
          "Saiu - recapagens": sa.recapagens ?? "",
          "Saiu - destino": sa.destino || "",
          "Entrou - nº de série": en.serie || (en.serieInformada ? en.serieInformada + " (não conferida)" : ""),
          "Entrou - marcação do pneu": en.tagPneu || "",
          "Entrou - tipo do pneu": tipoDe(en.tagPneu) ? nomeTipo(tipoDe(en.tagPneu).codigo) : "",
          "Entrou - medida": en.medida || "",
          "Entrou - condição": en.condicao || "",
          "Entrou - recapagens": en.recapagens ?? "",
          "Motivo": txtMotivo(r),
          "Defeito": txtDefeito(r),
          "Motivo (outro)": r.motivo === "Outro" ? (r.motivoTexto || "") : "",
          "Observações": r.observacoes || "",
          "Correção": r.correcao ? fmtDataHora(r.correcao.em) + " · " + r.correcao.motivo + (r.correcao.marcacoesAntes ? " (marcação registrada antes: " + Object.values(r.correcao.marcacoesAntes).join(" e ") + ")" : "") : "",
          "Registrado no tablet em": r.criadoEm ? fmtDataHora(r.criadoEm) : "",
          "Enviado ao banco": r._pendente ? "Aguardando envio" : "Sim"
        };
      });

      /* aba 2: um chamado por linha */
      const linhasCham = chamados.map((g, k) => {
        const r = g[0], e = eqInfo(r);
        const subs = {}; g.forEach((x) => { subs[(x.chamadoId || x._id) + "|" + x.dataHora] = x; });
        const lanc = Object.values(subs).sort((a, b) => String(a.dataHora).localeCompare(String(b.dataHora)));
        const durTot = lanc.reduce((s, x) => s + (typeof x.duracaoMin === "number" ? x.duracaoMin : 0), 0);
        const ultimo = lanc[lanc.length - 1];
        const motivos = {}; g.forEach((x) => { const m = txtMotivo(x) + (txtDefeito(x) ? " (" + txtDefeito(x) + ")" : ""); motivos[m] = (motivos[m] || 0) + 1; });
        return {
          "Nº chamado": k + 1,
          "Data": dataExcel(lanc[0].dataServico),
          "Hora entrada": lanc[0].horaServico || "",
          "Hora saída": (ultimo.fim && ultimo.fim.hora) || "",
          "Duração (h:mm)": horasMin(durTot),
          "Duração (min)": durTot,
          "OM / nota": r.om || "",
          "TAG equipamento": r.tag || "",
          "Descrição do equipamento": e.descricao || "",
          "Família": e.familia || "",
          "Área": e.area || "",
          "Borracheiro": (r.borracheiro && r.borracheiro.nome) || "",
          "Matrícula": (r.borracheiro && r.borracheiro.matricula) || "",
          "Pneus (total)": g.length,
          "Trocas": g.filter((x) => x.servico !== "conserto").length,
          "Consertos no local": g.filter((x) => x.servico === "conserto").length,
          "Lançamentos no tablet": lanc.length,
          "Posições": g.map((x) => txtPos(x.posicao)).join(" | "),
          "Motivos": Object.entries(motivos).map(([m, n]) => (n > 1 ? n + "x " : "") + m).join(" | "),
          "Pneus novos montados": g.filter((x) => x.servico !== "conserto" && x.entrou && x.entrou.recapagens !== null && Number(x.entrou.recapagens) === 0).length,
          "Pneus recapados montados": g.filter((x) => x.servico !== "conserto" && x.entrou && Number(x.entrou.recapagens) > 0).length,
          "KM / Horímetro": r.leitura ? (r.leitura.unidade === "H" ? "Horímetro" : "KM") : (r.semLeitura ? "Sem horímetro" : ""),
          "Leitura": r.leitura ? Number(r.leitura.valor) : "",
          "Observações": r.observacoes || ""
        };
      });

      /* aba 3: por equipamento */
      const porEq = new Map();
      regs.forEach((r) => {
        if (!porEq.has(r.tag)) porEq.set(r.tag, { rs: [], ch: new Set() });
        const o = porEq.get(r.tag); o.rs.push(r); o.ch.add(chaveCham(r));
      });
      const linhasEq = Array.from(porEq.entries()).map(([tag, o]) => {
        const e = equip.find((x) => x.tag === tag) || o.rs[0].equipamento || {};
        const datas = o.rs.map((x) => x.dataServico).sort();
        const durCham = {}; o.rs.forEach((x) => { durCham[x.chamadoId || x._id] = x.duracaoMin || 0; });
        const minTot = Object.values(durCham).reduce((s, v) => s + v, 0);
        return {
          "TAG equipamento": tag, "Descrição": e.descricao || "", "Família": e.familia || "", "Área": e.area || "",
          "Chamados": o.ch.size, "Pneus trocados": o.rs.filter((x) => x.servico !== "conserto").length,
          "Consertos no local": o.rs.filter((x) => x.servico === "conserto").length,
          "Furado": o.rs.filter((x) => x.motivo === "Pneu furado").length,
          "Careca": o.rs.filter((x) => x.motivo === "Pneu careca").length,
          "Com defeito": o.rs.filter((x) => x.motivo === "Pneu com defeito").length,
          "Estourado": o.rs.filter((x) => x.motivo === "Pneu estourado").length,
          "Fim de vida": o.rs.filter((x) => x.motivo === "Fim de vida").length,
          "Roda/aro danificado": o.rs.filter((x) => x.motivo === "Roda/aro danificado").length,
          "Outro": o.rs.filter((x) => x.motivo === "Outro").length,
          "Tempo total (h:mm)": horasMin(minTot),
          "Primeira troca": dataExcel(datas[0]), "Última troca": dataExcel(datas[datas.length - 1])
        };
      }).sort((a, b) => (b["Pneus trocados"] + b["Consertos no local"]) - (a["Pneus trocados"] + a["Consertos no local"]));

      /* aba 4: por motivo/defeito */
      const porMot = {};
      regs.forEach((r) => { const k = (r.servico === "conserto" ? "Conserto no local" : "Troca") + "|" + txtMotivo(r) + "|" + (txtDefeito(r) || (r.motivo === "Outro" ? r.motivoTexto || "" : "")); porMot[k] = (porMot[k] || 0) + 1; });
      const linhasMot = Object.entries(porMot).map(([k, n]) => { const [s, m, d] = k.split("|"); return { "Serviço": s, "Motivo": m, "Detalhe": d, "Pneus": n, "% do total": Math.round((n / regs.length) * 1000) / 10 }; })
        .sort((a, b) => b["Pneus"] - a["Pneus"]);

      /* aba 5: por borracheiro */
      const porB = new Map();
      regs.forEach((r) => {
        const k = (r.borracheiro && r.borracheiro.matricula) || "?";
        if (!porB.has(k)) porB.set(k, { nome: (r.borracheiro && r.borracheiro.nome) || "", ch: {}, n: 0 });
        const o = porB.get(k); o.n++; o.ch[r.chamadoId || r._id] = r.duracaoMin || 0;
      });
      const linhasB = Array.from(porB.entries()).map(([mat, o]) => {
        const nCh = Object.keys(o.ch).length, min = Object.values(o.ch).reduce((s, v) => s + v, 0);
        return { "Borracheiro": o.nome, "Matrícula": mat, "Chamados": nCh, "Pneus trocados": o.n, "Tempo total (h:mm)": horasMin(min), "Tempo médio por chamado (min)": nCh ? Math.round(min / nCh) : 0 };
      }).sort((a, b) => b["Pneus trocados"] - a["Pneus trocados"]);

      /* aba 6: por destino do pneu que saiu e por condição do que entrou */
      const contar = (f) => { const o = {}; regs.forEach((r) => { const k = f(r); if (k !== "") o[k] = (o[k] || 0) + 1; }); return o; };
      const dest = contar((r) => (r.saiu && r.saiu.destino) || "Não informado");
      const recE = contar((r) => (r.servico === "conserto" ? "" : r.entrou && r.entrou.condicao === "Maciço" ? "Maciço" : r.entrou && r.entrou.recapagens !== undefined && r.entrou.recapagens !== null ? (Number(r.entrou.recapagens) === 0 ? "Novo (0)" : r.entrou.recapagens + "ª recapagem") : "Não informado"));
      const linhasPneus = [
        ...Object.entries(dest).map(([k, n]) => ({ "Grupo": "Destino do pneu que saiu", "Item": k, "Pneus": n })),
        ...Object.entries(recE).sort().map(([k, n]) => ({ "Grupo": "Pneu que entrou", "Item": k, "Pneus": n }))
      ];

      const info = [
        { "Campo": "Relatório", "Valor": "Controle de Borracharia — trocas de pneu" },
        { "Campo": "Período", "Valor": (de ? fmtData(de) : "início") + " a " + (ate ? fmtData(ate) : "hoje") },
        { "Campo": "Filtro de busca", "Valor": $("#i-busca-ctrl").value.trim() || "nenhum" },
        { "Campo": "Chamados", "Valor": chamados.length },
        { "Campo": "Pneus atendidos (trocas + consertos)", "Valor": regs.length },
        { "Campo": "Equipamentos atendidos", "Valor": porEq.size },
        { "Campo": "Gerado em", "Valor": fmtDataHora(new Date().toISOString()) }
      ];

      /* pneus cadastrados (marcação e estoque) */
      const linhasPneusCad = pneusCad.slice().sort((a, b) => (String(a.tag).slice(4) + String(a.tag).slice(0, 3)).localeCompare(String(b.tag).slice(4) + String(b.tag).slice(0, 3))).map((pn) => {
        const t = TIPOS_MAP[pn.tipo] || tipoDe(pn.tag) || {}, l = pn.local || {};
        const evs = pn.eventos || [];
        return {
          "Marcação": pn.tag || "", "Nº do pneu": String(pn.tag || "").slice(0, 3), "Código do tipo": t.codigo || "", "Tipo": t.medida || pn.medida || "",
          "Nº de série": pn.serie || "", "DOT": pn.dot || "", "Marca": pn.marca || "", "Recapagens": pn.recapagens ?? "",
          "Situação": NOME_STATUS[pn.status] || pn.status || "",
          "Equipamento atual": pn.status === "montado" ? l.equipTag || "" : "", "Descrição do equipamento": pn.status === "montado" ? l.equipDesc || "" : "",
          "Eixo": pn.status === "montado" ? l.eixo ?? "" : "", "Lado": pn.status === "montado" ? l.lado || "" : "", "Posição": pn.status === "montado" ? l.posicao || "" : "",
          "Cadastrado em": pn.criadoEm ? fmtDataHora(pn.criadoEm) : "", "Cadastrado por": (pn.criadoPor && pn.criadoPor.nome) || "",
          "Última movimentação": evs.length ? evs[evs.length - 1].texto : "", "Data da última movimentação": evs.length ? fmtDataHora(evs[evs.length - 1].data) : "",
          "Nº de movimentações": evs.length
        };
      });
      const porTipo = {};
      pneusCad.forEach((pn) => {
        const c = pn.tipo || (tipoDe(pn.tag) || {}).codigo || "—";
        const o = porTipo[c] = porTipo[c] || { estoque: 0, patio: 0, montado: 0, recapagem: 0, conserto: 0, sucata: 0, total: 0 };
        o.total++; if (o[pn.status] !== undefined) o[pn.status]++;
      });
      const linhasTipo = Object.keys(porTipo).sort().map((c) => ({
        "Código": c, "Tipo": TIPOS_MAP[c] ? TIPOS_MAP[c].medida : "", "Estoque (novos)": porTipo[c].estoque, "Pátio (usados)": porTipo[c].patio,
        "Prontos para montar": porTipo[c].estoque + porTipo[c].patio, "Montados": porTipo[c].montado, "Na recapagem": porTipo[c].recapagem,
        "No conserto": porTipo[c].conserto, "Sucata": porTipo[c].sucata, "Números usados": porTipo[c].total, "Números livres": Math.max(0, 1000 - porTipo[c].total)
      }));
      info.push({ "Campo": "Pneus cadastrados (todos)", "Valor": pneusCad.length });
      info.splice(5, 0, { "Campo": "Trocas de pneu", "Valor": regs.filter((r) => r.servico !== "conserto").length },
        { "Campo": "Consertos no local", "Valor": regs.filter((r) => r.servico === "conserto").length });
      /* recapagens no período (pela vida de cada pneu marcado) */
      const linhasRecap = [];
      pneusCad.forEach((pn) => (pn.eventos || []).forEach((ev) => {
        const d = ev.data ? hojeISO(new Date(ev.data)) : "";
        if ((de && d < de) || (ate && d > ate)) return;
        let mov = null, antes = "", depois = "";
        const txt = String(ev.texto || "");
        if (ev.tipo === "volta_recapagem") { mov = "Voltou da recapagem"; antes = ev.de ?? ""; depois = ev.para ?? ""; }
        else if (ev.tipo === "enviado_recapagem" || /→ Recapagem/.test(txt) || /→ Na recapagem/.test(txt)) mov = "Enviado para recapagem";
        else { const m = /recapagens (\d+|\?) → (\d+)/.exec(txt); if (m && /Na recapagem →/.test(txt)) { mov = "Voltou da recapagem"; antes = m[1]; depois = m[2]; } }
        if (!mov) return;
        const t = TIPOS_MAP[pn.tipo] || tipoDe(pn.tag) || {};
        linhasRecap.push({ "Data": dataExcel(d), "Movimento": mov, "Marcação": pn.tag || "", "Tipo": t.codigo ? nomeTipo(t.codigo) : (pn.medida || ""), "Nº de série": pn.serie || "",
          "Recapagens antes": antes === "?" ? "" : antes, "Recapagens depois": depois, "Detalhe": txt, "Borracheiro": ev.por || "", "OM": ev.om || "" });
      }));
      linhasRecap.sort((a, b) => (a["Data"] && b["Data"] ? a["Data"] - b["Data"] : 0));
      info.push({ "Campo": "Pneus enviados para recapagem (período)", "Valor": linhasRecap.filter((x) => x["Movimento"] === "Enviado para recapagem").length },
        { "Campo": "Pneus que voltaram da recapagem (período)", "Valor": linhasRecap.filter((x) => x["Movimento"] === "Voltou da recapagem").length });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, folha(XLSX, trocas, [11, 9, 11, 9, 9, 8, 9, 12, 14, 34, 20, 18, 14, 11, 10, 20, 10, 8, 8, 6, 10, 9, 16, 14, 10, 12, 16, 14, 16, 12, 10, 18, 20, 18, 30, 18, 14]), "Trocas (por pneu)");
      XLSX.utils.book_append_sheet(wb, folha(XLSX, linhasCham, [9, 11, 9, 9, 9, 8, 12, 14, 34, 20, 18, 20, 10, 9, 40, 40, 10, 10, 11, 10, 30]), "Chamados");
      XLSX.utils.book_append_sheet(wb, folha(XLSX, linhasEq, [14, 34, 20, 18, 9, 9, 7, 7, 10, 9, 7, 12, 12, 12]), "Por equipamento");
      XLSX.utils.book_append_sheet(wb, folha(XLSX, linhasMot, [20, 26, 8, 10]), "Por motivo");
      XLSX.utils.book_append_sheet(wb, folha(XLSX, linhasB, [22, 10, 9, 10, 12, 14]), "Por borracheiro");
      XLSX.utils.book_append_sheet(wb, folha(XLSX, linhasPneus, [26, 22, 8]), "Pneus (destino e condição)");
      XLSX.utils.book_append_sheet(wb, folha(XLSX, linhasRecap, [11, 22, 10, 30, 16, 10, 10, 60, 20, 12]), "Recapagens no período");
      XLSX.utils.book_append_sheet(wb, folha(XLSX, linhasTipo, [8, 28, 10, 10, 10, 10, 10, 10, 8, 10, 10]), "Estoque por tipo");
      XLSX.utils.book_append_sheet(wb, folha(XLSX, linhasPneusCad, [10, 8, 8, 28, 16, 14, 10, 16, 14, 30, 6, 10, 10, 16, 18, 50, 16, 10]), "Pneus cadastrados");
      XLSX.utils.book_append_sheet(wb, folha(XLSX, info, [26, 44]), "Info");
      const nome = "Borracharia_" + (de || "inicio") + "_a_" + (ate || hojeISO()) + ".xlsx";
      XLSX.writeFile(wb, nome, { compression: true });
      msg.innerHTML = '<div class="msg-ok">Planilha gerada: ' + esc(nome) + " · " + chamados.length + (chamados.length === 1 ? " chamado" : " chamados") + ", " + regs.length + (regs.length === 1 ? " pneu" : " pneus") + ". Confira na pasta de downloads.</div>";
    } catch (e) {
      console.error(e);
      msg.innerHTML = '<div class="pendencias">Não foi possível gerar a planilha. Tente de novo.</div>';
    } finally { btn.disabled = false; }
  });

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
