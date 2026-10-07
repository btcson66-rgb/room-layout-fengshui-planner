import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import path from 'node:path';

test('built layout-guide breadcrumbs reference existing routes in both languages',()=>{
  let checked=0;
  for(const locale of ['en','zh']){
    const folder=path.join('dist',locale,'layout-guides');
    const routes=readdirSync(folder,{withFileTypes:true}).filter(entry=>entry.isDirectory());
    assert.ok(routes.length>0,'Guide build must exist before this check');
    for(const route of routes){
      const html=readFileSync(path.join(folder,route.name,'index.html'),'utf8');
      const schemas=[...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
        .flatMap(match=>{const value=JSON.parse(match[1]);return Array.isArray(value)?value:[value];});
      const breadcrumbs=schemas.filter(value=>value['@type']==='BreadcrumbList');
      assert.ok(breadcrumbs.length>0,`${locale}/${route.name}: breadcrumbs missing`);
      for(const breadcrumb of breadcrumbs)for(const item of breadcrumb.itemListElement){
        const url=new URL(typeof item.item==='string'?item.item:item.item['@id']);
        assert.equal(url.origin,'https://roomfeng.win');
        assert.ok(existsSync(path.join('dist',url.pathname,'index.html')),`Missing breadcrumb route: ${url.pathname}`);
      }
      checked++;
    }
  }
  assert.equal(checked,12,'Check all six existing guides in each language');
});
