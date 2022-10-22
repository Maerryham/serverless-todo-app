import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios, { AxiosError, AxiosResponse } from 'axios'
import jwkToPem from 'jwk-to-pem';
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = 'https://dev-g7sxmw0s.us.auth0.com/.well-known/jwks.json'

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
  const jwt: Jwt = decode(token, { complete: true }) as Jwt
  validateJwt(jwt);

  const key = getJwKeys(jwksUrl, jwt);

  // TODO: Implement token verification
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
  const pem = jwkToPem(key);
  return verify(token, pem, { algorithms: ['RS256'] }) as JwtPayload
}

async function getJwKeys (jwksUrl: string, decodedHeader: Jwt) {
  // -- Logging --

  try {
    const { data }: AxiosResponse = await Axios({
      method: 'GET',
      url: jwksUrl,
    });

    const key = data.keys.find(key => {
      logger.info('getJwKeys', JSON.stringify({ input: {jwksUrl, decodedHeader}, output: key.kid === decodedHeader['kid']})) 
      return key.kid === decodedHeader['kid'];
    });

    validateKey(key);
       logger.info('getJwKeys', JSON.stringify({ input: {jwksUrl, decodedHeader}, output: key})) 
     
    return key;

  } catch (error) {
    const err = error as AxiosError;
    const errData = err.response?.data as { detail: string; message: null };

    logger.error('getJwKeys', JSON.stringify({
      output: 'Invalid Unable to retrieve jwkeys at this time '}), errData)
    throw new Error('Invalid Unable to retrieve jwkeys at this time '+ errData)
  }

};

function validateKey(key: string) {
  if (!key || key.length === 0) {
    logger.error('validateKey', JSON.stringify({
      output: 'decodedJwt can not be empty'}))
    
    throw new Error('decodedJwt can not be empty');
  }
}

function validateJwt(decodedJwt): void {
  
  const { kid, iss, aud } = decodedJwt
  if (!decodedJwt){
    logger.error('validateJwt', JSON.stringify({ input: decodedJwt, output: 'decodedJwt can not be empty'}))
    throw new Error('decodedJwt can not be empty');
  }
  if (!kid){
    logger.error('validateJwt', JSON.stringify({ input: decodedJwt, output: 'decodedJwt does not container kid'}))
    throw new Error('decodedJwt does not container kid');
  }
  if (!iss){
    logger.error('validateJwt', JSON.stringify({ input: decodedJwt, output: 'decodedJwt does not container iss'}))
    throw new Error('decodedJwt does not container iss');
  }
  if (!aud){
    logger.error('validateJwt', JSON.stringify({ input: decodedJwt, output: 'decodedJwt does not container aud'}))
    throw new Error('decodedJwt does not container aud');
  }
}

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
