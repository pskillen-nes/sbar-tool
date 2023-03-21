import deepmerge from "deepmerge";

type AuthOptions = {
  client: {
    id: string,
  }
  auth: {
    tokenHost: string,
    tokenPath: string,
    authorizePath: string,
    loginPath: string,
    redirectUrl: string,
    scopes: string,
  }
}

type EnvironmentConfigProps = {
  site: {
    urlRoot: string,
  }
  auth: AuthOptions,
  empi: {
    baseUrl: string,
    apiKey: string,
  },
  fhir: {
    baseUrl: string,
    apiKey: string,
    corsAnywhere?: {
      enabled: boolean,
      urlPrefix: string,
    }
  },
}

const CognitoAuthDefaults: AuthOptions = {
  client: {
    id: '<default>',
  },
  auth: {
    tokenHost: '<default>',
    tokenPath: '/oauth2/token',
    authorizePath: '/oauth2/authorize',
    loginPath: '/login',
    redirectUrl: '<default>',
    scopes: 'openid profile',
  }
};

const devSandboxConfig: EnvironmentConfigProps = {
  site: {
    urlRoot: '/sbar-tool/',
  },
  auth: deepmerge(CognitoAuthDefaults,
    {
      client: {
        id: '8vukkhs8sgsp3pkqt4rhcfrdn',
      },
      auth: {
        tokenHost: 'https://dev-ndp-sandbox-fhir-service.auth.eu-west-2.amazoncognito.com',
        redirectUrl: 'https://pskillen-nes.github.io/sbar-tool/',
      }
    }),
  empi: {
    baseUrl: 'https://empi.sandbox.dev.platform.ndp.scot',
    apiKey: 'EP6G9q72B36nT0bw4wBJ74yMa12f05XeFLwONL34',
  },
  fhir: {
    baseUrl: 'https://ndp-sandbox-clinical-fhir.dev.platform.ndp.scot',
    apiKey: 'EP6G9q72B36nT0bw4wBJ74yMa12f05XeFLwONL34',
    corsAnywhere: {
      enabled: true,
      urlPrefix: 'http://localhost:7080/',
    }
  }
};

const localSandboxConfig: EnvironmentConfigProps = deepmerge(devSandboxConfig, {
  site: {
    urlRoot: '/',
  },
  auth: {
    auth: {
      redirectUrl: 'http://localhost:3001/',
    }
  }
});

export default devSandboxConfig;
// export default localSandboxConfig;
