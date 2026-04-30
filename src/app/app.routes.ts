import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { FamiliesComponent } from './pages/families/families.component';
import { ResidentsComponent } from './pages/residents/residents.component';
import { ServicesComponent } from './pages/services/services.component';
import { LoginComponent } from './pages/login/login.component';
import { ResidentDetailComponent } from './pages/resident-detail/resident-detail.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { RegionInsightsComponent } from './pages/region-insights/region-insights.component';
import { UsersComponent } from './pages/users/users.component';
import { ArticlesComponent } from './pages/articles/articles.component';
import { ApbdesComponent } from './pages/apbdes/apbdes.component';
import { InventoryComponent } from './pages/inventory/inventory.component';
import { ResidentAnalysisComponent } from './pages/analysis/analysis.component';
import { Verify } from './pages/verify/verify';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'verify/:id', component: Verify },
  { 
    path: '', 
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'families', component: FamiliesComponent },
      { path: 'residents', component: ResidentsComponent },
      { path: 'residents/:nik', component: ResidentDetailComponent },
      { path: 'services', component: ServicesComponent },
      { path: 'articles', component: ArticlesComponent },
      { path: 'apbdes', component: ApbdesComponent },
      { path: 'inventory', component: InventoryComponent },
      { path: 'region-insights', component: RegionInsightsComponent },
      { path: 'users', component: UsersComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'inventory', component: InventoryComponent, title: 'Inventaris Aset - DigiWarga' },
      { path: 'analysis', component: ResidentAnalysisComponent, title: 'Analisis Bansos - DigiWarga' },
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
