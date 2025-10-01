const AccessControl = require("accesscontrol");

const ac = new AccessControl();

ac.grant("buyer").readOwn("product");

ac.grant("seller")
  .extend("buyer")
  .createOwn("product")
  .readOwn("product")
  .updateOwn("product")
  .deleteOwn("product");

ac.grant("admin")
  .extend("seller")
  .extend("buyer")
  .readAny("product")
  .updateAny("product")
  .deleteAny("product");

module.exports = ac;
