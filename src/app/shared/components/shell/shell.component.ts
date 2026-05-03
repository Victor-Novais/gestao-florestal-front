import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: Array<'ROLE_ADMIN' | 'ROLE_COLABORADOR'>;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/dashboard', roles: ['ROLE_ADMIN', 'ROLE_COLABORADOR'] },
  { label: 'Areas', icon: 'forest', route: '/areas', roles: ['ROLE_ADMIN'] },
  { label: 'Especies', icon: 'eco', route: '/especies', roles: ['ROLE_ADMIN'] },
  { label: 'Rel. Especies', icon: 'description', route: '/relatorios/especies', roles: ['ROLE_ADMIN'] },
  { label: 'Colaboradores', icon: 'group', route: '/colaboradores', roles: ['ROLE_ADMIN'] },
  { label: 'Equipamentos', icon: 'construction', route: '/equipamentos', roles: ['ROLE_ADMIN'] },
  { label: 'Plantio', icon: 'grass', route: '/plantio', roles: ['ROLE_ADMIN', 'ROLE_COLABORADOR'] },
  { label: 'Inventario', icon: 'inventory', route: '/inventario', roles: ['ROLE_ADMIN', 'ROLE_COLABORADOR'] },
  { label: 'Ocorrencias', icon: 'warning_amber', route: '/ocorrencias', roles: ['ROLE_ADMIN', 'ROLE_COLABORADOR'] },
  { label: 'Relatorios', icon: 'bar_chart', route: '/relatorios', roles: ['ROLE_ADMIN', 'ROLE_COLABORADOR'] }
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent implements OnInit {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  private readonly auth = inject(AuthService);
  private readonly bp = inject(BreakpointObserver);

  currentUser = toSignal(this.auth.currentUser$);
  isMobile = signal(false);
  isTablet = signal(false);
  isSidebarCollapsed = signal(false);

  sidenavMode = computed(() => (this.isMobile() ? 'over' : 'side'));
  sidenavOpened = computed(() => !this.isMobile());
  showSidebarText = computed(() => this.isMobile() || !this.isSidebarCollapsed());
  showPageTitle = computed(() => !this.isMobile() || !this.isSidebarCollapsed());

  navItems = computed(() => {
    const user = this.currentUser();
    if (!user) {
      return [];
    }

    return NAV_ITEMS.filter((item) => item.roles.includes(user.role));
  });

  ngOnInit(): void {
    this.bp.observe([Breakpoints.XSmall, Breakpoints.Small]).subscribe((result) => {
      const mobile = result.matches;
      this.isMobile.set(mobile);

      if (mobile) {
        this.isSidebarCollapsed.set(false);
      }
    });

    this.bp.observe([Breakpoints.Medium]).subscribe((result) => {
      this.isTablet.set(result.matches);

      if (result.matches && !this.isMobile()) {
        this.isSidebarCollapsed.set(true);
      }
    });
  }

  logout(): void {
    this.auth.logout();
  }

  toggleNavigation(): void {
    if (this.isMobile()) {
      this.sidenav.toggle();
      return;
    }

    this.isSidebarCollapsed.update((value) => !value);
  }

  onNavigate(): void {
    if (this.isMobile()) {
      this.sidenav.close();
    }
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user?.email) {
      return '?';
    }

    return user.email.substring(0, 2).toUpperCase();
  }
}
