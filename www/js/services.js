var bitcore = require('bitcore');
var Mnemonic = require('bitcore-mnemonic');
var ECIES = require('bitcore-ecies');
var Buffer = bitcore.deps.Buffer;

angular.module('snowden.services', [])

.service('wallet', function(storage) {
     
    var service = {};
    
    var network = bitcore.Networks.testnet;
    
    if(storage.get('mnemonic') == null) {
      service.mnemonic = new Mnemonic().toString();
      storage.set('mnemonic', service.mnemonic);
    } else {
      service.mnemonic = storage.get('mnemonic');
    }
    
    service.privateKey = new Mnemonic(service.mnemonic).toHDPrivateKey();
    service.address = new bitcore.Address(service.privateKey.publicKey, network).toString();
    
    service.setMnemonic = function(code) {
        service.mnemonic =  new Mnemonic(code).toString();
        service.privateKey = new Mnemonic(service.mnemonic).toHDPrivateKey();
        service.address = new bitcore.Address(service.privateKey.publicKey, network).toString();
        
        storage.set('mnemonic', service.mnemonic);
    }
    
    service.getPublicKey = function() {
      return service.privateKey.publicKey;
    }
    
    service.toPublicKey = function(from) {
      return new bitcore.PublicKey(from);
    }
    
    service.toPublicKeyHashString = function(from) {
      var pk = service.toPublicKey(from);
      var addr = new bitcore.Address(pk, network);
      return addr.toString();
    }
    
    service.getPrivateKey = function() {
      return service.privateKey.privateKey;
    }
    
    service.createDataAddress = function(hex) {
      
      var data = new Buffer(hex, 'hex');
      return new bitcore.Address(data, network, bitcore.Address.PayToPublicKeyHash).toString();
    }
    
    service.getDataFromAddress = function(address) {
      
      var addr = new bitcore.Address(address, network, bitcore.Address.PayToPublicKeyHash);
      
      return addr;
    }
    
    service.createTXFromData = function(dataString, utxos, address) {
      var data = new Buffer(dataString, 'hex');
      
      var buffs = [];
      
      // Split the data into 20 byte length buffers.
      var zeros = new Buffer(20);
      var padding = 0;
      for(var i = 0; i < data.length; i+= 20) {
        
        var slice = data.slice(i, i + 20);
        
        if(slice.length < 20) {
          padding = 20  - slice.length;
          slice = Buffer.concat([slice, zeros.slice(0, padding)]);
        }
        
        buffs.push(slice);
      }
      
      var tx = new bitcore.Transaction();
      
      // Flag the destination, later we want to add buckets here.
      tx.to(address, 1022);
      
      for(var i = 0; i < utxos.length; i++) {
        tx.from(utxos[i]);
      }
      
      for(var i = 0; i < buffs.length; i++) {
        
        // We need to encode the padding into the fee
        if(i == buffs.length - 1)
          tx.to(service.createDataAddress(buffs[i]), 1000 + padding);
        else
          tx.to(service.createDataAddress(buffs[i]), 1000);
      }
      
      tx.change(service.getPublicKey());
      
      tx.sign(service.getPrivateKey());
      
      return tx.toBuffer().toString('hex');
    }
    
    service.getOriginator = function(txObj) {
      
      var change = txObj.vout[txObj.vout.length - 1];
      var addr = Object.keys(change)[0];
      
      return addr;
    }
    
    service.getDataFromInsightTX = function(txObj) {
      
        
      var data = new Buffer(0);
        
      for(var i = 0; i < txObj.vout.length; i++) {
        
        var txOut = txObj.vout[i];
        
        var addr = Object.keys(txOut)[0];
        var satoshis = parseInt(txOut[addr]);
        var padding = 0
        // Is this a data output.
        if(satoshis == 1000) {
          data = Buffer.concat([data, service.getDataFromAddress(addr).hashBuffer]);
        } 
        
        if(satoshis > 1000 && satoshis < 1021) {
          var padding = satoshis - 1000;
          var hash = service.getDataFromAddress(addr).hashBuffer;
          var hashWithoutPAdding = hash.slice(0, 20 - padding);
          data = Buffer.concat([data, hashWithoutPAdding]);
        }
      }
          
      return data.toString('hex');
    }
 
    return service;
})

.service('messages', function(storage, wallet, ecies, $rootScope) {
     
  var service = {};
    
  // Listen to all TX's
  var socket = io("https://test-insight.bitpay.com");
  socket.on('connect', function() {
    // Join the room.
    socket.emit('subscribe', 'inv');
  })
  socket.on('tx', function(data) {
    console.log("New transaction received: " + JSON.stringify(data));
      
    try {
    
      var encrypted = wallet.getDataFromInsightTX(data);
      
      console.log(encrypted);
        
      var msg = ecies.decrypt(encrypted, wallet.getPublicKey(), wallet.getPrivateKey());
      
      service.addMessage(wallet.getOriginator(data), msg);
      
      $rootScope.$apply();
      
    }  catch(err) {
      console.log('Not one of ours.' + err);
    }
  })
    
  var messageCache = {
    'mgDLbirZsaZ8jRTfPYW6Vv5z4KkizqzCLx': [
      { text: 'Hello World'}],
    'mqdfWTbyZGHANkidLijPjR4La63X49DJxT': [
      { text: 'Doe sit work ?'}],
  };
  
  service.addMessage = function(from, message) {
    if(messageCache[from] == null) {
      messageCache[from] = [{ text: message }];
    } else {
       messageCache[from].push({ text: message });
    }
  }
  
  service.getMessages = function(from) {
    return messageCache[from];
  }

  return service;
})

.service('ecies', function(storage) {
     
    var service = {};
    
    service.encrypt = function(text, publicKey, privateKey) {
      // Encrypt data
      var cypher = ECIES().privateKey(privateKey).publicKey(publicKey);
      return cypher.encrypt(text).toString('hex');
    }
    
    service.decrypt = function(text, publicKey, privateKey) {
      // Encrypt data
      var cypher = ECIES().privateKey(privateKey).publicKey(publicKey);
      return cypher.decrypt(new Buffer(text, 'hex')).toString();
    }
 
    return service;
})

.service('porn_name', function(storage) {
     
  var pet_names = [
    "Aardvark","Aba","Abacuss","Abbashy","Abbe","Abbot","Abdullah","Aberdeen",
    "Abner","Abrak","Abu","Acadia","Ace","Actra","Adal","Addison",
    "Adele","Admiral","Adolfo","Adonis","Adriane","Agora","Aika","Aikido",
    "Ainsley","Ajax","Akeem","Akiak","Aladdin","Alanna","Aldo","Alexe","Alcapone",
    "Alf","Alissa","Allegro","Allie","Alfonso","Alonso","Ali","Alpha","Alyssa",
    "Amadeus","Amanda","Amber","Ambrosia","Amelda","Amelie","Amico","Amigo","Amir",
    "Amur","Anabela","Anastasia","Andora","Android","Angel","Angelica","Angora","Anita",
    "Annie","Ante","Apache","Aphrodite","Apo","Apollo","Apu","Aquarius","Archie",
    "Arctic","Arden","Ares","Argos","Ariadne","","Arielle,Arissa","Arkan","Armando",
    "Armona","Arriba","Arsenio","Aruba","Ascot","Ashlee Ashy","Asi","Asimov","Askot",
    "Aspen","Astor","Athena","Attilla","Augustus","Aura","Aurora Austin","Autumn",
    "Avalanche","Avanti","Avera","Avona","Axel","Aza","Azalea","Azar Baba","Babar",
    "Babca","Babe","Babet Babs","Baca","Baccara","Bach","Baco","Badges","Baffu",
    "Baebel","Baggins","Bailey","Baizle","Balente","Baloo","Balzac","Bambi","Bandi",
    "Bandito","Banshee","Banya","Barbi","Barcley","Barkas","Barney","Barstonia","Basco",
    "Bashful","Bayer","Bazza","Beacon","Beanie","Bear","Beatrice","Beaux","Beavis","Becka",
    "Bedrock","Beecham","Begonia","Beja","Bek","Bela","Belisimo","Belle","Beneditto","Benji",
    "Beno","Beny","Berber","Bernardo","Berner","Besie","Bexter","Bianco","Bijou","Bimbo",
    "Bingo","Bishop","Bismarck","Blanche","Blarney","Blitsy","Blossem","Blu","Bocefus",
    "Boggs","Bojangles","Bomba","Bono","Bonzo","Booker","Bordeaux","Borscht","Boswell",
    "Brasko","Braveheart","Breston","Brie","Britany","Broadway","Brock","Bronx",
    "Brundi","Brutus","Bryce","Bubba","Buckeye","Buddy","Buffy","Buggoo","Bugsie",
    "Bumbles","Bugsy","Bumpkin","Bundy","Burk Cabot","Cactus","Caddy","Caesar",
    "Cagney","Cain","Calamity","Caldwell","Caliber","Calico","Calina","Calisha",
    "Callie","Callista","Calloway","Calpernicus","Calphurnia","Calvin","Calzone",
    "Camaron","Cameo","Camile","Camo","Cancellor","Candie","Cannes","Canuck",
    "Capella","Capkin","Cappuccino","Cappy","Capricorn","Captain","Cara","Caramelo",
    "Cardiff","Carisma","Carleigh","Carlton","Carmel","Caro","Carson","Carter",
    "Cartwright","Casablanca","Casanova","Casey","Cashew","Caspar","Cassandra","Cassidy",
    "Caster","Cataline","Catrin","Cayetana","Cecilie","Celeste","Cenna","Cerena","Cessy",
    "Chadwick","Challenger","Chamois","Champagne","Chance","Chandler","Chantilly","Chaos",
    "Chaplin","Chaps","Charcoal","Charles","Chaser","Chata","Chavez","Checca","Cheerio",
    "Chelsea","Chessnut","Chevelle","Chewbacca","Chewie","Cheyenne","Chicory","Chinook",
    "Cinderalla","Clarabel","Clifford","Columbus","Comet","Commander","Conan","Connie",
    "Corky","Cosmo","Courtney","Cripto","Crockett","Cupid Dablo","Dacron","Daffy","Daisy",
    "Dakota","Damian","Dancer","Dante","Danu","Dapper","Darwin","Dasher","Dato","Davos",
    "Dawber","Dawson","Dax","Dazzle","Deacon","Decker","Delbert","Delco","Delmonte",
    "Delta","Delphi","Demetre","Dempsey","Desiree","Desmond","Desoto","Dewey","Diaz",
    "Dickens","Dido","Dimples","Dino","Dixie","Disco","Doc","Dokie","Doodle","Doofus",
    "Doogie","Dot","Draka","Drako","Dreyfus","Dryden","Dutchess","Dynamo Eagle","Ebba",
    "Ebony","Earl","Easton","Ebony","Echo","Eclipse","Eddie","Eden","Edgar","Edison",
    "Effie","Einstein","Electra","Elf","Elijah","Elisa","Ella","Elliot","Ellis","Elmer",
    "Elmo","Elroy","Elsa","Elvira","Elvis","Elwood","Elza","Emar","Emerald","Emerson",
    "Emmit","Emir","Emma","Emma","Emrick","Enigma","Evita","Ezzy Fabian","Faith",
    "Falcon","Fandango","Fannie","Farao","Farris","Fearless","Felicity","Felix",
    "Fellow","Fenja","Fenton","Fergus","Ferra","Ferris","Fester","Fida","Fido",
    "Fiffi","Filibuster","Fingal","Finnigan","Fitzi","Fitzpatrick","Flash","Fletcher",
    "Flica","Flicker","Floppy","Flossy","Fluffy","Flutie","Fogarty","Fonda","Fonzie",
    "Forrest","Foster","Foxy","Fozzie","Fraiser","Frances","Franco","Franz","Freakles",
    "Freddie","Freeway","Fresca","Frieda","Frodo","Frosty Gabbi","Gadget","Gala",
    "Galena","Galileo","Galvani","Gamma","Garbo","Garfield","Garfunkel","Garrett",
    "Gator","Gatsby","Gecko","Gemini","Geoffroie","Georgette","Gerber","Gershwin",
    "Ghandi","Ghost","Gia","Gibson","Giddy","Gidget","Giggles","Gilles","Gillespie",
    "Gilligan","Gilroy","Ginger","Gino","Gipzy","Gizmo","Glory","Goblin Goldilocks",
    "Gomez","Gonzo","Goofy","Gorbie","Gorky","Gotham","Gotti","Grace","Granite",
    "Grayson","Gremlin","Greta","Griffin","Gringo","Gussie Hacker","Hackett","Haden",
    "Hagar","Hagen","Haggis","Hagerty","Haig","Hailey","Hakan","Hakeem","Hammer",
    "Hancock","Hannah","Harley","Harvard","Harvey","Hawkeye","Heatcliff","Hecate",
    "Heckle","Heidi","Helga","Henderson","Henna","Herbie","Hershey","Highlander",
    "Hilda","Hilton","Hippy","Hobart","Hobbes","Hocus Pocus","Hogan","Holly",
    "Hollywood","Homer","Hootie","Hopkins","Horton","Hoss","Howie","Hubble","Hudson",
    "Hugo","Hulk","Hurricane","Hutch Ibex","Ibiza","Ibycus","Iceman","Icky","Idola",
    "Iggy","Igor","Ike","Ilene","Immanuel","Inca","Indigo","Indy","Inky","Iris",
    "Irwin","Isaac","Isabelle","Issey Jabbar","Jackal","Jacqueline","Jaded","Jasper",
    "Jazz","Jeeves","Jenkins","Jeoffroi","Jesse","Jigger","Jimmy","Jitterbug",
    "Jocelyn","Joffrey","Jokester","Jonesie","Judas","Jukebox","Justice Kahn","Kaiser",
    "Kamaz","Kansas","Karl","Karlos","Kashmir","Kato","Kaufman","Kayla Keaton",
    "Kefir","Kellogg","Kerby","Kessel","Kibbles","Kiko","Kiwi","Kozmo","Kylie Lace",
    "Laddie","Lamour","Lancelot","Lassie","Leeroy","Lemur","Lennox","Lester",
    "Levi","Lexis","Liberty","Lightning","Lisbon","Litmus","Lombardi","Lopez",
    "Lorenzo","Luciano","Luzette Mable","Macgregor","Macy","Mahika","Major",
    "Malibu","Marco","Mattea","Maxx","Mayzie","McDuff","Meiko","Melessa","Memphis",
    "Midas","Miguel","Minie","Mirabella","Misty","Muggsy Nanno","Naples","Natalie",
    "Nathan","Natika","Neddy","Neiko","Nella","Nemo","Nibbles Nidda","Nimbus",
    "Nirvana","Novac","Nugget","Nutmeg","Nutrella","Nubbin","Noris","Nitro Obe",
    "Odana","Odell","Odis","Ogee","Olandra","Olexa","Olf","Olga","Oliver","Olympia",
    "Omega","Omer","Orbis","Orissa","Osborne","Oscar","Outlaw","Oxford","Ozzie Pablo",
    "Paddington","Pancho","Peanuts","Pebbles","Pedro","Penelope","Pepper","Perdita",
    "Petra","Phantom","Pheobe","Picasso","Pikas","Pinnochio","Piper","Pixel","Pokey",
    "Prancer","Pluto Quada","Quadra","Quadrant","Quaker","Quarda","Quark","Quartino",
    "Quartz","Quatro","Queen","Querk","Quervo","Quesadilla","Questa","Quicken",
    "Quicksilver","Quintino","Quincy","Quran","Quazi Racine","Rafael","Ralphie",
    "Ramal","Ramses","Rasputin","Reggie","Remy","Rhinestone","Ricardo","Ricochet",
    "Ringo","Ripper","Rocco","Rocket","Romeo","Rosko","Roxette","Ruffouss",
    "Ruggles Sabastian","Samantha","Sampson","Scoobie","Scrappy","Sergeant",
    "Shaggy","Shasta","Sheba","Sherlock","Siegmund","Slyvestor","Snowflake",
    "Socrates","Sonjah","Sonny","Sophie","Sparky","Spencer","Sprocket Tabatha",
    "Tannas","Tarzan","Tazy","Tess","Theo","Thor","Tiffany","Tinkerbelle",
    "Tobey","Tonto","Tootsie","Tristian","Trixie","Trooper","Tucker",
    "Twinkes","Twiggy","Tyson","Tigger Ubu","Udessa","Ugene","Ulka","Ulanda",
    "Ullie","Ulrik","Ulysses","Umberto","Unesko","Uni","Uno","Uther","Uranius",
    "Urchin","Uriah","Uros","Ursa","Uzzo","Unity Vagabond","Valda","Vanderbuilt",
    "Vangogh","Vargo","Velcro","Velda","Venus","Verna","Vernon","Vibes","Victor",
    "Viky","Vigor","Vincent","Violette","Virgil","Vivian","Vixie",
    "Vladimir Wacco","Waddles","Wags","Waldorf","Walessa","Warden","Warlock",
    "Wart","Wasabi","Watson","Waverly","Wessex","Weston","Whisper","Wichita",
    "Wiggles","Wilhelmina","Winnie","Wrigley","Wyatt Xabina","Xadur","Xalmos",
    "Xamir","Xandros","Xanta","Xanthie","Xanto","Xar","Xaros","Xavier","Xcell",
    "Xecke","Xeniana","Xenophon","Xero","Xerxes","Xinca","Xippe","Xystos Yaakov",
    "Yackie","Yahsi","Yalaz","Yaman","Yanda","Yankee","Yaren","Yasmir","Yates",
    "Yawney","Yazgi","Yazz","Yeoman","Yetti","Yigit","Ying","Ylanda","Yoda","Yogi Zaba"
    ,"Zabou","Zabrina","Zacharias","Zack","Zally","Zamboni","Zampara","Zannie",
    "Zappa","Zargo","Zassa","Zedon","Zeff","Zelda","Zena","Zeuss","Zsa","Zucker","Zwazoo"
  ];
  
  service.porn_name = function(compressed_public_key) {
    // Divide the key in 2, use first half for first name
    // seconf half for second name
    var first = compressed_public_key.substring(2, 18);
    var second = compressed_public_key.substring(18, 34);
    
    var fmod = parseInt(first, 16) % pet_names.length;
    var smod = parseInt(second, 16) % pet_names.length;
    
    return pet_names[fmod] + " " + pet_names[smod];
  }  
 
  return service;
});