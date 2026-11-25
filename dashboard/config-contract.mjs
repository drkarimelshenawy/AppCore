export const platforms=Object.freeze(['android','web']);
export function normalizeConfig(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid config');
 const {maintenance=false,message='',minimumVersion=0,flags={}}=input;
 if(typeof maintenance!=='boolean'||typeof message!=='string'||message.length>500||!Number.isSafeInteger(minimumVersion)||minimumVersion<0||minimumVersion>2100000000||!flags||typeof flags!=='object'||Array.isArray(flags)||Object.keys(flags).length>50)throw Error('Invalid config');
 for(const [k,v] of Object.entries(flags))if(!/^[a-z][a-z0-9_]{0,39}$/.test(k)||typeof v!=='boolean')throw Error('Invalid flag');
 return {maintenance,message,minimumVersion,flags:Object.fromEntries(Object.entries(flags))};
}
export function configId(app,platform){if(!/^[a-z0-9][a-z0-9-]{1,49}$/.test(app)||!platforms.includes(platform))throw Error('Invalid target');return app+'_'+platform;}
