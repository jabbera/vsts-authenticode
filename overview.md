# Authenticode sign

This task can authenticode sign binaries. If the certificate is in the user store it just works. Now supporting securefile.

*  Version 2.0
  * Fix bug inverting the selection of user store and computer store (this is a breaking change).
  * Add delay between retries for timestamp server.
  * Make custom tool location actually work.
  * Support selecting certificate by SHA1 hash for stores
  * Support minimatch patterns instead of current scheme (breaking change)


Icons made by Freepik from http://www.flaticon.com is licensed by CC 3.0 BY