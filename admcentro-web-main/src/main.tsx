import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import './App.css'
import './responsive.css'
import './loadingAndAnimations.css'
import { router } from './routes'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { AuthProvider } from './context/authContext'

import 'primereact/resources/themes/md-light-indigo/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'

import 'react-responsive-modal/styles.css'
import FullLoading from './components/FullLoading'

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// staleTime: Infinity,
			retry: 2,
			refetchOnWindowFocus: false,
			// cacheTime: Infinity,
		},
	},
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<React.Suspense fallback={<FullLoading />}>
					<RouterProvider router={router} />
				</React.Suspense>
			</AuthProvider>
		</QueryClientProvider>
	</React.StrictMode>
)
