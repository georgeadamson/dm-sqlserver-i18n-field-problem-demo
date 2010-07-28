//
// This file allows Firefox to open links to documents on the network.
//
// Save this file to here and restart Firefox:
//	C:\Documents and Settings\George\Application Data\Mozilla\Firefox\Profiles\upuz6cfk.default
//
// More info:
// - http://stackoverflow.com/questions/1289063/how-to-bypass-document-domain-limitations-when-opening-local-files
//

// Allow access to specific servers: (Cannot get this technique to work!)
// user_pref("capability.policy.policynames", "localfilelinks");
// user_pref("capability.policy.localfilelinks.sites", "\\selsvr01 file://///selsvr01 http://database http://databasedev http://databasetest http://database2 http://database2 http://database2dev http://database2test");
// user_pref("capability.policy.localfilelinks.checkloaduri.enabled", "allAccess");

// Allow access to any network resource: (This works but may be too broad)
user_pref("capability.policy.default.checkloaduri.enabled", "allAccess");
