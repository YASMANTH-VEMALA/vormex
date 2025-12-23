// Indian States, Districts, and Cities data
// This is a comprehensive dataset for location dropdowns

export interface LocationData {
  [state: string]: {
    [district: string]: string[]
  }
}

export const locationData: LocationData = {
  "Andhra Pradesh": {
    "Anantapur": ["Anantapur", "Hindupur", "Kadiri", "Guntakal"],
    "Chittoor": ["Chittoor", "Tirupati", "Madanapalle", "Pileru"],
    "East Godavari": ["Kakinada", "Rajahmundry", "Amalapuram", "Peddapuram"],
    "Guntur": ["Guntur", "Tenali", "Narasaraopet", "Mangalagiri"],
    "Krishna": ["Vijayawada", "Machilipatnam", "Gudivada", "Nuzvid"],
    "Kurnool": ["Kurnool", "Nandyal", "Adoni", "Dhone"],
    "Nellore": ["Nellore", "Gudur", "Kavali", "Sullurpeta"],
    "Prakasam": ["Ongole", "Markapur", "Chirala", "Kandukur"],
    "Srikakulam": ["Srikakulam", "Palasa", "Amadalavalasa", "Narasannapeta"],
    "Visakhapatnam": ["Visakhapatnam", "Anakapalle", "Bheemunipatnam", "Narsipatnam"],
    "Vizianagaram": ["Vizianagaram", "Bobbili", "Parvathipuram", "Nellimarla"],
    "West Godavari": ["Eluru", "Bhimavaram", "Tadepalligudem", "Tanuku"],
    "YSR Kadapa": ["Kadapa", "Proddatur", "Pulivendla", "Rayachoti"]
  },
  "Arunachal Pradesh": {
    "Itanagar Capital Complex": ["Itanagar", "Naharlagun"],
    "Papum Pare": ["Yupia", "Doimukh"],
    "Tawang": ["Tawang"],
    "West Kameng": ["Bomdila", "Dirang"]
  },
  "Assam": {
    "Guwahati": ["Guwahati", "Dispur"],
    "Dibrugarh": ["Dibrugarh", "Naharkatia"],
    "Jorhat": ["Jorhat", "Titabor"],
    "Nagaon": ["Nagaon", "Hojai"],
    "Silchar": ["Silchar", "Hailakandi"],
    "Tezpur": ["Tezpur", "Sonitpur"]
  },
  "Bihar": {
    "Araria": ["Araria", "Forbesganj"],
    "Aurangabad": ["Aurangabad", "Daudnagar"],
    "Begusarai": ["Begusarai", "Barauni"],
    "Bhagalpur": ["Bhagalpur", "Naugachhia"],
    "Gaya": ["Gaya", "Bodh Gaya", "Sherghati"],
    "Muzaffarpur": ["Muzaffarpur", "Sitamarhi"],
    "Patna": ["Patna", "Danapur", "Hajipur", "Phulwari Sharif"],
    "Purnia": ["Purnia", "Kasba"],
    "Samastipur": ["Samastipur", "Rosera"]
  },
  "Chhattisgarh": {
    "Bilaspur": ["Bilaspur", "Mungeli"],
    "Durg": ["Durg", "Bhilai", "Rajnandgaon"],
    "Raipur": ["Raipur", "Naya Raipur", "Arang"],
    "Korba": ["Korba", "Katghora"],
    "Jagdalpur": ["Jagdalpur", "Kondagaon"]
  },
  "Delhi": {
    "Central Delhi": ["Connaught Place", "Karol Bagh", "Paharganj"],
    "East Delhi": ["Preet Vihar", "Laxmi Nagar", "Mayur Vihar"],
    "New Delhi": ["AIIMS", "Saket", "Hauz Khas", "Greater Kailash"],
    "North Delhi": ["Civil Lines", "Model Town", "Pitampura"],
    "South Delhi": ["Vasant Kunj", "Mehrauli", "Chhatarpur"],
    "West Delhi": ["Janakpuri", "Dwarka", "Rajouri Garden"]
  },
  "Goa": {
    "North Goa": ["Panaji", "Mapusa", "Calangute", "Anjuna"],
    "South Goa": ["Margao", "Vasco da Gama", "Ponda", "Canacona"]
  },
  "Gujarat": {
    "Ahmedabad": ["Ahmedabad", "Gandhinagar", "Sanand", "Dholka"],
    "Bharuch": ["Bharuch", "Ankleshwar"],
    "Bhavnagar": ["Bhavnagar", "Mahuva"],
    "Jamnagar": ["Jamnagar", "Dwarka"],
    "Junagadh": ["Junagadh", "Veraval"],
    "Kutch": ["Bhuj", "Gandhidham", "Mundra"],
    "Rajkot": ["Rajkot", "Morbi", "Gondal"],
    "Surat": ["Surat", "Bardoli", "Navsari"],
    "Vadodara": ["Vadodara", "Bharuch", "Anand"]
  },
  "Haryana": {
    "Faridabad": ["Faridabad", "Ballabgarh"],
    "Gurgaon": ["Gurgaon", "Manesar", "Sohna"],
    "Hisar": ["Hisar", "Hansi"],
    "Karnal": ["Karnal", "Panipat"],
    "Rohtak": ["Rohtak", "Jhajjar"],
    "Ambala": ["Ambala", "Panchkula"]
  },
  "Himachal Pradesh": {
    "Shimla": ["Shimla", "Solan"],
    "Kangra": ["Dharamshala", "Kangra", "Palampur"],
    "Mandi": ["Mandi", "Sundernagar"],
    "Kullu": ["Kullu", "Manali"]
  },
  "Jharkhand": {
    "Bokaro": ["Bokaro Steel City", "Chas"],
    "Dhanbad": ["Dhanbad", "Jharia"],
    "East Singhbhum": ["Jamshedpur", "Gamharia"],
    "Ranchi": ["Ranchi", "Hatia", "Namkum"],
    "Hazaribagh": ["Hazaribagh", "Ramgarh"]
  },
  "Karnataka": {
    "Bagalkot": ["Bagalkot", "Badami"],
    "Ballari": ["Ballari", "Hospet"],
    "Belagavi": ["Belagavi", "Gokak"],
    "Bengaluru Urban": ["Bengaluru", "Whitefield", "Electronic City", "Marathahalli", "Koramangala", "Indiranagar", "Jayanagar"],
    "Bengaluru Rural": ["Devanahalli", "Nelamangala"],
    "Dakshina Kannada": ["Mangaluru", "Puttur", "Bantwal"],
    "Dharwad": ["Dharwad", "Hubli"],
    "Hassan": ["Hassan", "Belur"],
    "Kalaburagi": ["Kalaburagi", "Sedam"],
    "Mysuru": ["Mysuru", "Nanjangud", "Hunsur"],
    "Shivamogga": ["Shivamogga", "Bhadravati"],
    "Tumakuru": ["Tumakuru", "Tiptur"],
    "Udupi": ["Udupi", "Kundapura"]
  },
  "Kerala": {
    "Alappuzha": ["Alappuzha", "Cherthala"],
    "Ernakulam": ["Kochi", "Aluva", "Perumbavoor"],
    "Kannur": ["Kannur", "Thalassery"],
    "Kollam": ["Kollam", "Punalur"],
    "Kottayam": ["Kottayam", "Pala"],
    "Kozhikode": ["Kozhikode", "Vadakara"],
    "Malappuram": ["Malappuram", "Manjeri"],
    "Palakkad": ["Palakkad", "Ottapalam"],
    "Pathanamthitta": ["Pathanamthitta", "Thiruvalla"],
    "Thiruvananthapuram": ["Thiruvananthapuram", "Neyyattinkara"],
    "Thrissur": ["Thrissur", "Chalakudy"]
  },
  "Madhya Pradesh": {
    "Bhopal": ["Bhopal", "Sehore"],
    "Gwalior": ["Gwalior", "Morena"],
    "Indore": ["Indore", "Mhow", "Dewas"],
    "Jabalpur": ["Jabalpur", "Katni"],
    "Rewa": ["Rewa", "Satna"],
    "Ujjain": ["Ujjain", "Nagda"]
  },
  "Maharashtra": {
    "Ahmednagar": ["Ahmednagar", "Shrirampur"],
    "Aurangabad": ["Aurangabad", "Jalna"],
    "Kolhapur": ["Kolhapur", "Ichalkaranji"],
    "Mumbai City": ["Mumbai", "Colaba", "Fort", "Marine Lines"],
    "Mumbai Suburban": ["Andheri", "Bandra", "Borivali", "Malad", "Goregaon", "Kandivali"],
    "Nagpur": ["Nagpur", "Kamptee"],
    "Nashik": ["Nashik", "Malegaon"],
    "Pune": ["Pune", "Pimpri-Chinchwad", "Hinjewadi", "Kothrud", "Wakad"],
    "Solapur": ["Solapur", "Pandharpur"],
    "Thane": ["Thane", "Navi Mumbai", "Kalyan", "Dombivli", "Ulhasnagar"]
  },
  "Manipur": {
    "Imphal East": ["Imphal"],
    "Imphal West": ["Lamphelpat"],
    "Bishnupur": ["Bishnupur"]
  },
  "Meghalaya": {
    "East Khasi Hills": ["Shillong"],
    "West Garo Hills": ["Tura"],
    "Ri Bhoi": ["Nongpoh"]
  },
  "Mizoram": {
    "Aizawl": ["Aizawl"],
    "Lunglei": ["Lunglei"]
  },
  "Nagaland": {
    "Kohima": ["Kohima"],
    "Dimapur": ["Dimapur"]
  },
  "Odisha": {
    "Bhubaneswar": ["Bhubaneswar"],
    "Cuttack": ["Cuttack", "Jagatsinghpur"],
    "Ganjam": ["Berhampur", "Gopalpur"],
    "Khordha": ["Bhubaneswar", "Jatni"],
    "Puri": ["Puri", "Konark"],
    "Sambalpur": ["Sambalpur", "Burla"],
    "Sundargarh": ["Rourkela", "Sundargarh"]
  },
  "Punjab": {
    "Amritsar": ["Amritsar", "Tarn Taran"],
    "Bathinda": ["Bathinda", "Rampura Phul"],
    "Jalandhar": ["Jalandhar", "Phagwara"],
    "Ludhiana": ["Ludhiana", "Khanna"],
    "Mohali": ["Mohali", "Kharar"],
    "Patiala": ["Patiala", "Rajpura"]
  },
  "Rajasthan": {
    "Ajmer": ["Ajmer", "Kishangarh"],
    "Alwar": ["Alwar", "Bhiwadi"],
    "Bikaner": ["Bikaner"],
    "Jaipur": ["Jaipur", "Sanganer", "Amber"],
    "Jodhpur": ["Jodhpur", "Pali"],
    "Kota": ["Kota", "Baran"],
    "Udaipur": ["Udaipur", "Chittorgarh"]
  },
  "Sikkim": {
    "East Sikkim": ["Gangtok"],
    "West Sikkim": ["Geyzing"],
    "South Sikkim": ["Namchi"]
  },
  "Tamil Nadu": {
    "Chennai": ["Chennai", "Tambaram", "Ambattur", "Velachery", "Adyar", "Anna Nagar"],
    "Coimbatore": ["Coimbatore", "Tirupur", "Pollachi"],
    "Erode": ["Erode", "Gobichettipalayam"],
    "Kanchipuram": ["Kanchipuram", "Chengalpattu"],
    "Madurai": ["Madurai", "Melur"],
    "Salem": ["Salem", "Mettur"],
    "Thanjavur": ["Thanjavur", "Kumbakonam"],
    "Tiruchirappalli": ["Tiruchirappalli", "Srirangam"],
    "Tirunelveli": ["Tirunelveli", "Palayamkottai"],
    "Vellore": ["Vellore", "Ranipet"]
  },
  "Telangana": {
    "Hyderabad": ["Hyderabad", "Secunderabad", "Kukatpally", "Madhapur", "Gachibowli", "Hitec City"],
    "Karimnagar": ["Karimnagar", "Jagtial"],
    "Khammam": ["Khammam", "Kothagudem"],
    "Medak": ["Sangareddy", "Siddipet"],
    "Nalgonda": ["Nalgonda", "Miryalaguda"],
    "Nizamabad": ["Nizamabad", "Kamareddy"],
    "Rangareddy": ["LB Nagar", "Shamshabad", "Maheshwaram"],
    "Warangal": ["Warangal", "Hanamkonda"]
  },
  "Tripura": {
    "West Tripura": ["Agartala"],
    "Sepahijala": ["Bishalgarh"],
    "Gomati": ["Udaipur"]
  },
  "Uttar Pradesh": {
    "Agra": ["Agra", "Firozabad"],
    "Allahabad": ["Prayagraj", "Naini"],
    "Ghaziabad": ["Ghaziabad", "Noida", "Greater Noida"],
    "Gorakhpur": ["Gorakhpur", "Deoria"],
    "Kanpur": ["Kanpur", "Unnao"],
    "Lucknow": ["Lucknow", "Barabanki"],
    "Meerut": ["Meerut", "Modinagar"],
    "Varanasi": ["Varanasi", "Ramnagar"]
  },
  "Uttarakhand": {
    "Dehradun": ["Dehradun", "Mussoorie", "Rishikesh"],
    "Haridwar": ["Haridwar", "Roorkee"],
    "Nainital": ["Nainital", "Haldwani"],
    "Udham Singh Nagar": ["Rudrapur", "Kashipur"]
  },
  "West Bengal": {
    "Howrah": ["Howrah", "Uluberia"],
    "Kolkata": ["Kolkata", "Salt Lake", "Rajarhat", "New Town"],
    "North 24 Parganas": ["Barasat", "Barrackpore"],
    "South 24 Parganas": ["Diamond Harbour", "Kakdwip"],
    "Darjeeling": ["Darjeeling", "Siliguri"],
    "Nadia": ["Krishnanagar", "Ranaghat"],
    "Burdwan": ["Burdwan", "Durgapur", "Asansol"]
  }
}

export const getStates = (): string[] => {
  return Object.keys(locationData).sort()
}

export const getDistricts = (state: string): string[] => {
  if (!state || !locationData[state]) return []
  return Object.keys(locationData[state]).sort()
}

export const getCities = (state: string, district: string): string[] => {
  if (!state || !district || !locationData[state] || !locationData[state][district]) return []
  return locationData[state][district].sort()
}
