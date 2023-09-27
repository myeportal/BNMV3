// Needed if you want to add built-in marketplace

Moralis.Cloud.beforeSave("SoldItems", async (request) => {
    const query = new Moralis.Query("ItemsForSale");
    query.equalTo("uid", request.object.get("uid"));
    const item = await query.first();
    if (item) {
        request.object.set("item", item);
        item.set("isSold", true);
        await item.save();

        const userQuery = new Moralis.Query(Moralis.User);
        userQuery.equalTo("accounts", request.object.get("buyer"));
        const userObject = await userQuery.first({ useMasterKey: true });
        if (userObject) {
            request.object.set("user", userObject);
        }
    }
});

Moralis.Cloud.define("get_token_uri",(url) => {
    return Moralis.Cloud.httpRequest({
      "url": url,
      "headers": {
          'method': 'GET',
          'accept': 'application/json'
         }
     }).then(function(httpResponse){
      return httpResponse.data;
    },function(httpResponse){
      logger.info("error");
      logger.info(httpResponse);
    });
});

Moralis.Cloud.define("getUserInfo", async (request) => {
    const query = new Moralis.Query("User");
    query.equalTo("ethAddress", request.params.ethAddress)
    const results = await query.find({useMasterKey:true})
    return results;
});