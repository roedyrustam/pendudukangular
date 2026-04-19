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
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
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
      { path: 'region-insights', component: RegionInsightsComponent },
      { path: 'users', component: UsersComponent },
      { path: 'settings', component: SettingsComponent },
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
