
const RESTAURANT_IMG_ALTERNATES = [
  'Beautiful restaurant full of people',
  'One pizza on a wood table',
  'Big modern restaurant with a lof of space',
  'Katz\'s restaurant situated a corner viewed from outside',
  'Chicken of Roberta\'s Pizza restaurant and people sit at table',
  'American barbacue restaurant with lot of people',
  'Superiority burger restaurant viewed from outside',
  'Picture of the label of The dutch restaurant',
  'A boy and a girl eating ramen in Mu Ramen restaurant',
  'Modern and spacious restaurant with bar stools at the bar'
];

export default class ImgUtils {

  static getAlternateById(id) {
    return RESTAURANT_IMG_ALTERNATES[id];
  }

}