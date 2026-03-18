import { defineConfig } from 'vite';

export default defineConfig({
	  server: {
		      allowedHosts: [
			            '20.224.52.54',
			            '127.0.0.1',
			            'sdatral.mooo.com',
			            'localhost'
			          ]
		    }
});

