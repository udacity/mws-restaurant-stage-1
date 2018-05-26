const restaurant1 = require("responsive-loader?sizes[]=100,sizes[]=200,sizes[]=400,sizes[]=800!../img/1.jpg");
const restaurant2 = require("responsive-loader?sizes[]=100,sizes[]=200,sizes[]=400,sizes[]=800!../img/2.jpg");
const restaurant3 = require("responsive-loader?sizes[]=100,sizes[]=200,sizes[]=400,sizes[]=800!../img/3.jpg");
const restaurant4 = require("responsive-loader?sizes[]=100,sizes[]=200,sizes[]=400,sizes[]=800!../img/4.jpg");
const restaurant5 = require("responsive-loader?sizes[]=100,sizes[]=200,sizes[]=400,sizes[]=800!../img/5.jpg");
const restaurant6 = require("responsive-loader?sizes[]=100,sizes[]=200,sizes[]=400,sizes[]=800!../img/6.jpg");
const restaurant7 = require("responsive-loader?sizes[]=100,sizes[]=200,sizes[]=400,sizes[]=800!../img/7.jpg");
const restaurant8 = require("responsive-loader?sizes[]=100,sizes[]=200,sizes[]=400,sizes[]=800!../img/8.jpg");
const restaurant9 = require("responsive-loader?sizes[]=100,sizes[]=200,sizes[]=400,sizes[]=800!../img/9.jpg");
const restaurant10 = require("responsive-loader?sizes[]=100,sizes[]=200,sizes[]=400,sizes[]=800!../img/10.jpg");
const failwhale = require("responsive-loader?sizes[]=100,sizes[]=200,sizes[]=400,sizes[]=800!../img/failwhale.jpg");

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
