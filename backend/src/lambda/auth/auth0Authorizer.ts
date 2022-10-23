import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
// import Axios, { AxiosError, AxiosResponse } from 'axios'
// import jwkToPem from 'jwk-to-pem';
// import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
// const jwksUrl = 'https://dev-g7sxmw0s.us.auth0.com/.well-known/jwks.json'

const secretId = process.env.AUTH_0_SECRET_ID;
const cert = `-----BEGIN CERTIFICATE-----
MIIDDTCCAfWgAwIBAgIJbExKtwe/VrdkMA0GCSqGSIb3DQEBCwUAMCQxIjAgBgNV
BAMTGWRldi1nN3N4bXcwcy51cy5hdXRoMC5jb20wHhcNMjIxMDE3MTIxMDI3WhcN
MzYwNjI1MTIxMDI3WjAkMSIwIAYDVQQDExlkZXYtZzdzeG13MHMudXMuYXV0aDAu
Y29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAm4zWW+Ff1YFfxkrt
2VW7JuPUrf4y/sGEUTasXi4jGC9f+5j83FDnnji9wDax9TQZin50OMucA00rrmi0
jggLwH8XzlVpBa8oTyPA5CkFuEU+Urxvu7us04ImJrmhVRoqn+5FcU2Novt8jaIz
b9SqTzWWQ9dxUsC5OEEyOOCPlkcQvukVSjKm7/OjIzal89W4GZ3DcO4KRDnCC/JS
Y7dvVX55LbpyL4fGeOIpKJKId7WP9CfAarPzzy0DdxsxqoR/YaWxND5xRcQQpbHV
nAO0obsR59/Zgo1/hrPAWSl6WIU/2Mgtb3nwSWK8bliUxBp0gDGTUBoahQ86lGs2
3N4kxwIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBTfEtcNiJT9
oOTAggFOmVtMUEeS9zAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEB
AHVg1pPVv9299ekgplCoaqWXd4wu1qPryXv3OxV0qztcQNSXmrPeUJ7UoVKWm2d8
X3l8IgH3CYJmBAwucS29FzT1YJaqBIeSkLShXRi7Nd7dI4uQBUYYSJ7BIvbZdBAe
otL/fX1VN+bYIhxDU3i51E1U2sgv/j7I0V41D9WPSXObCwtk2OobNETCNgvLkN9j
GPH72sAv7kXDnNgl1+5zGYqGxiU06Exrn3vV33kWbe5y1zquuL/piVT8CXpZMv53
xio5MTAvgJfUHXX7nAURZx5cMuso7uoBAlCFvERRX0EphxjpIZhbwvBvRRDaVC7H
fvQTmHzbQZ+a2M5d8LvJm9Q=
-----END CERTIFICATE-----`;


export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('auth0Authorizer', 'User not authorized', JSON.stringify({ error: e.message }))

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  // const jwt: Jwt = decode(token, { complete: true }) as Jwt
  // validateJwt(jwt);

  // const key = getJwKeys(jwksUrl, jwt);

  // TODO: Implement token verification
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
  // const pem = jwkToPem(key);
  // return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload
  return verify(token, secretId) as JwtPayload
}

// async function getJwKeys (jwksUrl: string, decodedHeader: Jwt) {
//   // -- Logging --

//   try {
//     const { data }: AxiosResponse = await Axios({
//       method: 'GET',
//       url: jwksUrl,
//     });

//     const key = data.keys.find(key => {
//       logger.info('getJwKeys', JSON.stringify({ input: {jwksUrl, decodedHeader}, output: key.kid === decodedHeader['kid']})) 
//       return key.kid === decodedHeader['kid'];
//     });

//     validateKey(key);
//        logger.info('getJwKeys', JSON.stringify({ input: {jwksUrl, decodedHeader}, output: key})) 
     
//     return key;

//   } catch (error) {
//     const err = error as AxiosError;
//     const errData = err.response?.data as { detail: string; message: null };

//     logger.error('getJwKeys', JSON.stringify({
//       output: 'Invalid Unable to retrieve jwkeys at this time '}), errData)
//     throw new Error('Invalid Unable to retrieve jwkeys at this time '+ errData)
//   }

// };

// function validateKey(key: string) {
//   if (!key || key.length === 0) {
//     logger.error('validateKey', JSON.stringify({
//       output: 'decodedJwt can not be empty'}))
    
//     throw new Error('decodedJwt can not be empty');
//   }
// }

// function validateJwt(decodedJwt): void {
  
//   const { kid, iss, aud } = decodedJwt
//   if (!decodedJwt){
//     logger.error('validateJwt', { input: decodedJwt, output: 'decodedJwt can not be empty'})
//     throw new Error('decodedJwt can not be empty');
//   }
//   if (!kid){
//     logger.error('validateJwt', { input: decodedJwt, output: 'decodedJwt does not container kid'})
//     throw new Error('decodedJwt does not container kid');
//   }
//   if (!iss){
//     logger.error('validateJwt', { input: decodedJwt, output: 'decodedJwt does not container iss'})
//     throw new Error('decodedJwt does not container iss');
//   }
//   if (!aud){
//     logger.error('validateJwt', { input: decodedJwt, output: 'decodedJwt does not container aud'})
//     throw new Error('decodedJwt does not container aud');
//   }
// }

function getToken(authHeader: string): string {
  if (!authHeader){ 
  logger.error('getToken', JSON.stringify({ input: authHeader, output: 'No authentication header'})) 
  throw new Error('No authentication header')
  }

  if (!authHeader.toLowerCase().startsWith('bearer ')){
    logger.error('getToken', JSON.stringify({ input: authHeader, output: 'No authentication header'})) 
    throw new Error('Invalid authentication header')
  }

  const split = authHeader.split(' ')
  const token = split[1]

  logger.info('getToken', JSON.stringify({ input: authHeader, output: token})) 
    
  return token
}
