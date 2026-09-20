# Amazon Associates product source

The import source supplied for this rollout is:

`C:\Users\User\Downloads\amazon_affiliate_products_master.xlsx`

The production catalogue is `src/data/amazon-products.json`. It contains the 100 RoomFeng rows from the `ROOMFENG` sheet, promoted from the source `candidate` status to the explicit production `active` flag. The runtime never reads the workbook.

Each record keeps the ASIN, full tagged Special Link, tracking ID, official image URL, original product title, summary, category, CTA, alt text, target metadata, source status, and a default weight of `1`. Price, rating, review, inventory, discount, and sales claims are intentionally absent.
