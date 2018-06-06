import restaurant1 from "../img/1.jpg";
import restaurant2 from "../img/2.jpg";
import restaurant3 from "../img/3.jpg";
import restaurant4 from "../img/4.jpg";
import restaurant5 from "../img/5.jpg";
import restaurant6 from "../img/6.jpg";
import restaurant7 from "../img/7.jpg";
import restaurant8 from "../img/8.jpg";
import restaurant9 from "../img/9.jpg";
import restaurant10 from "../img/10.jpg";
import failwhale from "../img/failwhale.jpg";

export function getImage(fileName) {
  switch (fileName) {
    case "1":
      return restaurant1;
    case "2":
      return restaurant2;
    case "3":
      return restaurant3;
    case "4":
      return restaurant4;
    case "5":
      return restaurant5;
    case "6":
      return restaurant6;
    case "7":
      return restaurant7;
    case "8":
      return restaurant8;
    case "9":
      return restaurant9;
    case "10":
      return restaurant10;
    default:
    case "failwhale":
      return failwhale;
  }
}
