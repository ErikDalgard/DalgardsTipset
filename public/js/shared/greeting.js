(async () => {
  // Skicka tillbaka person till log in sida om de ej är inloggade
  const user = await requireAuth();
  if (!user) return; 
  document.getElementById("greeting").textContent = getGreeting(user.username);
})();

// Hälsningsfunction
function getGreeting(username) {
  const hour = new Date().getHours();
  const morningGreetings = [
      `God morgon ${username}!`,
      `Kaffe och tippning, ${username}?`,
      `Rise and tippa, ${username}!`,
      `Morgonpigg, ${username}?`,
      `Upp och hoppa, ${username}!`,
      `${username} är igång innan kaffe ens hunnit brygga!`,
      `Ny dag, nya tips, ${username}!`,
      `Godmorgon-tippning, ${username}?`,
      `${username}, dagens matcher väntar!`,
      `Soluppgång och skjutläge, ${username}!`,
      `Hoppas du sov gott, ${username}!`,
      `Redo för dagen, ${username}?`,
      `${username} startar dagen rätt!`,
      `Piggast av alla, ${username}?`,
      `Morronsvenska på ${username}!`,
    ];

    const dayGreetings = [
      `Tjenixen ${username}!`,
      `Läge att kolla dagens matcher, ${username}?`,
      `${username} i huset!`,
      `Middagsdags, ${username}!`,
      `Vad händer, ${username}?`,
      `Hallå där, ${username}!`,
      `${username}, redo att slå familjen i tips idag?`,
      `Dagsformen, ${username}?`,
      `${username} kollar läget!`,
      `Halva dagen kvar, ${username} - hunnit tippa?`,
      `Läget, ${username}?`,
      `${username} är på plats!`,
      `Fikadags, ${username}?`,
      `Full fart, ${username}!`,
      `${username}, hur går tipsandet?`,
    ];

    const eveningGreetings = [
      `God kväll ${username}!`,
      `Sena kvällen, ${username}? Matcherna väntar inte...`,
      `${username} kollar in på kvällskvisten!`,
      `Mysdags, ${username}!`,
      `Kväll, ${username} - hunnit tippa än?`,
      `${username} är tillbaka!`,
      `Skönt att se dig, ${username}!`,
      `Kvällspass, ${username}?`,
      `${username}, dags att slå sig ner!`,
      `Soffhörnet väntar, ${username}!`,
      `Sen eftermiddag, ${username}?`,
      `${username}, redo för kvällens matcher?`,
      `Skymning och tippning, ${username}!`,
      `${username} runt kvällsfikat!`,
      `Dags att varva ner, ${username}?`,
    ];

    const nightGreetings = [
      `God natt ${username}!`,
      `Nattugglan ${username} är framme!`,
      `${username} sover visst inte än...`,
      `Sent uppe, ${username}?`,
      `Midnattstippning, ${username}?`,
      `${username}, dags att lägga sig snart!`,
      `Nattskift, ${username}?`,
      `${username} håller nattkoll!`,
      `Sena kvisten, ${username}!`,
      `Kan inte sova, ${username}?`,
      `${username}, tipsandet fortsätter i natt?`,
      `Sömnen kan vänta, ${username}?`,
      `${username} är natt-tippare!`,
      `Tyst i huset, förutom ${username}...`,
      `Småtimmarna, ${username}?`,
    ];

  let options;
  if (hour >= 6 && hour <= 11) {
    options = morningGreetings;
  } else if (hour >= 11 && hour < 17) {
    options = dayGreetings;
  } else if (hour >= 17 && hour < 22) {
    options = eveningGreetings;
  } else {
    options = nightGreetings;
  }

  // Plocka en slumpmässig fras ur den valda listan
  const randomIndex = Math.floor(Math.random() * options.length);
  return options[randomIndex];
}