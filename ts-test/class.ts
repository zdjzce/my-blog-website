let strOrNumOrBool = 2

function testFun(strOrNumOrBool: string | number | boolean) {
  if (typeof strOrNumOrBool === "string") {
    // 一定是字符串！
    strOrNumOrBool.charAt(1);
  } else if (typeof strOrNumOrBool === "number") {
    strOrNumOrBool.toFixed();
  } else if (typeof strOrNumOrBool === "boolean") {
    strOrNumOrBool === true;
  } else {
    const _exhaustiveCheck: never = strOrNumOrBool;
    throw new Error(`Unknown input type: ${_exhaustiveCheck}`);
  }
}